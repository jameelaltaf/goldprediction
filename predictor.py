import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


class GoldPredictor:
    def __init__(self, forecast_days: int = 30):
        self.forecast_days = forecast_days
        self.model = RandomForestRegressor(
            n_estimators=300,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
        self.scaler = StandardScaler()
        self.feature_cols: list[str] = []
        self.is_trained = False

    def _add_features(self, df: pd.DataFrame) -> pd.DataFrame:
        data = df[["Close"]].copy()
        for col in ("High", "Low", "Volume"):
            if col in df.columns:
                data[col] = df[col]

        close = data["Close"]
        n = len(close)

        # Moving averages and ratio to close
        for w in [5, 7, 14, 21]:
            if n > w:
                data[f"MA{w}"] = close.rolling(w).mean()
                data[f"MA{w}_ratio"] = close / data[f"MA{w}"]
        if n > 50:
            data["MA50"] = close.rolling(50).mean()
            data["MA50_ratio"] = close / data["MA50"]
        if n > 200:
            data["MA200"] = close.rolling(200).mean()
            data["MA200_ratio"] = close / data["MA200"]

        # EMAs
        for span in [9, 12, 26]:
            data[f"EMA{span}"] = close.ewm(span=span, adjust=False).mean()
            data[f"EMA{span}_ratio"] = close / data[f"EMA{span}"]

        # RSI(14)
        delta = close.diff()
        gain = delta.where(delta > 0, 0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        data["RSI"] = 100 - (100 / (1 + gain / (loss + 1e-10)))

        # MACD
        exp12 = close.ewm(span=12, adjust=False).mean()
        exp26 = close.ewm(span=26, adjust=False).mean()
        data["MACD"] = exp12 - exp26
        data["MACD_Signal"] = data["MACD"].ewm(span=9, adjust=False).mean()
        data["MACD_Hist"] = data["MACD"] - data["MACD_Signal"]

        # Bollinger Bands
        bb_mid = close.rolling(20).mean()
        bb_std = close.rolling(20).std()
        bb_upper = bb_mid + 2 * bb_std
        bb_lower = bb_mid - 2 * bb_std
        data["BB_width"] = (bb_upper - bb_lower) / (bb_mid + 1e-10)
        data["BB_position"] = (close - bb_lower) / (bb_upper - bb_lower + 1e-10)

        # Returns and volatility
        data["Return_1d"] = close.pct_change(1)
        for p in [2, 3, 5, 7, 14, 21, 30]:
            data[f"Return_{p}d"] = close.pct_change(p)
        data["Volatility_7"] = data["Return_1d"].rolling(7).std()
        data["Volatility_21"] = data["Return_1d"].rolling(21).std()
        data["Volatility_ratio"] = data["Volatility_7"] / (data["Volatility_21"] + 1e-10)

        # Lag features
        for lag in [1, 2, 3, 5, 7, 14, 21, 30]:
            data[f"Lag_{lag}"] = close.shift(lag)

        # High-Low features
        if "High" in data.columns and "Low" in data.columns:
            data["HL_ratio"] = (data["High"] - data["Low"]) / (close + 1e-10)
            # Stochastic %K
            low14 = data["Low"].rolling(14).min()
            high14 = data["High"].rolling(14).max()
            data["Stoch_K"] = 100 * (close - low14) / (high14 - low14 + 1e-10)
            data["Stoch_D"] = data["Stoch_K"].rolling(3).mean()
            # ATR
            prev_close = close.shift(1)
            tr = pd.concat(
                [data["High"] - data["Low"],
                 (data["High"] - prev_close).abs(),
                 (data["Low"] - prev_close).abs()],
                axis=1,
            ).max(axis=1)
            data["ATR_ratio"] = tr.rolling(14).mean() / (close + 1e-10)

        # Volume features
        if "Volume" in data.columns:
            vol = data["Volume"].replace(0, np.nan)
            vol_ma = vol.rolling(20).mean()
            data["Volume_ratio"] = vol / (vol_ma + 1e-10)

        # Calendar features
        if hasattr(data.index, "dayofweek"):
            data["DayOfWeek"] = data.index.dayofweek
            data["Month"] = data.index.month
            data["Quarter"] = data.index.quarter

        return data

    def _prepare(self, df: pd.DataFrame):
        data = self._add_features(df)
        data["Target"] = data["Close"].shift(-self.forecast_days)
        data = data.dropna()

        exclude = {"Target", "Close", "High", "Low", "Volume"}
        self.feature_cols = [c for c in data.columns if c not in exclude]

        X = data[self.feature_cols]
        y = data["Target"]
        return X, y, data

    def train(self, df: pd.DataFrame) -> dict:
        X, y, _ = self._prepare(df)

        split = int(len(X) * 0.8)
        X_train, X_test = X.iloc[:split], X.iloc[split:]
        y_train, y_test = y.iloc[:split], y.iloc[split:]

        self.scaler.fit(X_train)
        X_train_s = self.scaler.transform(X_train)
        X_test_s = self.scaler.transform(X_test)

        self.model.fit(X_train_s, y_train)
        self.is_trained = True

        y_pred = self.model.predict(X_test_s)

        # Per-tree predictions for confidence intervals
        tree_preds = np.array([t.predict(X_test_s) for t in self.model.estimators_])
        lower = np.percentile(tree_preds, 10, axis=0)
        upper = np.percentile(tree_preds, 90, axis=0)

        dir_acc = float(
            np.mean(
                np.sign(y_pred - X_test["Lag_1"].values)
                == np.sign(y_test.values - X_test["Lag_1"].values)
            )
            * 100
        )

        metrics = {
            "MAE": mean_absolute_error(y_test, y_pred),
            "RMSE": float(np.sqrt(mean_squared_error(y_test, y_pred))),
            "R²": r2_score(y_test, y_pred),
            "MAPE (%)": float(
                np.mean(np.abs((y_test.values - y_pred) / (y_test.values + 1e-10))) * 100
            ),
            "Directional Accuracy (%)": dir_acc,
        }

        feature_importance = pd.Series(
            self.model.feature_importances_, index=self.feature_cols
        ).sort_values(ascending=False)

        prediction_dates = X_test.index + pd.Timedelta(days=self.forecast_days)

        return {
            "metrics": metrics,
            "test_dates": prediction_dates,
            "y_test": y_test.values,
            "y_pred": y_pred,
            "lower": lower,
            "upper": upper,
            "feature_importance": feature_importance,
        }

    def predict_future(self, df: pd.DataFrame) -> tuple[float, float, float]:
        if not self.is_trained:
            raise RuntimeError("Call train() before predict_future()")

        data = self._add_features(df).dropna()
        # Fill any feature columns not present with zero
        for col in self.feature_cols:
            if col not in data.columns:
                data[col] = 0.0

        X_last = data[self.feature_cols].iloc[-1:].values
        X_last_s = self.scaler.transform(X_last)

        point = self.model.predict(X_last_s)[0]
        tree_pts = np.array([t.predict(X_last_s)[0] for t in self.model.estimators_])
        lower = float(np.percentile(tree_pts, 10))
        upper = float(np.percentile(tree_pts, 90))

        return float(point), lower, upper

import warnings
from datetime import timedelta

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st
import yfinance as yf
from plotly.subplots import make_subplots

from predictor import GoldPredictor

warnings.filterwarnings("ignore")

# ── Page setup ────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Gold Price Predictor",
    page_icon="🥇",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    .stMetric { border-radius:8px; padding:8px; }
    .signal-badge {
        display:inline-block; padding:4px 12px; border-radius:20px;
        font-size:0.85rem; font-weight:600; margin:3px;
    }
    .bullish  { background:rgba(38,166,154,0.2); color:#26a69a; border:1px solid #26a69a; }
    .bearish  { background:rgba(239,83,80,0.2);  color:#ef5350; border:1px solid #ef5350; }
    .neutral  { background:rgba(255,193,7,0.2);  color:#ffc107; border:1px solid #ffc107; }
    </style>
    """,
    unsafe_allow_html=True,
)

# ── Sidebar ───────────────────────────────────────────────────────────────────
st.sidebar.title("Settings")

TICKERS = {
    "Gold Futures  (GC=F)": "GC=F",
    "SPDR Gold ETF (GLD)":  "GLD",
    "iShares Gold  (IAU)":  "IAU",
}
ticker_label = st.sidebar.selectbox("Instrument", list(TICKERS.keys()))
ticker = TICKERS[ticker_label]

PERIODS = {"1 Year": "1y", "2 Years": "2y", "3 Years": "3y", "5 Years": "5y"}
period_label = st.sidebar.selectbox("Historical data", list(PERIODS.keys()), index=1)
period = PERIODS[period_label]

forecast_days = st.sidebar.slider("Forecast horizon (days)", 7, 90, 30, step=7)

st.sidebar.markdown("---")
st.sidebar.markdown("**Chart overlays**")
show_ma  = st.sidebar.checkbox("Moving Averages", value=True)
show_bb  = st.sidebar.checkbox("Bollinger Bands", value=True)
show_vol = st.sidebar.checkbox("Volume bars",     value=True)

# ── Data helpers ──────────────────────────────────────────────────────────────

@st.cache_data(ttl=300)
def load_data(ticker: str, period: str) -> pd.DataFrame:
    t  = yf.Ticker(ticker)
    df = t.history(period=period, auto_adjust=True)
    df.index = df.index.tz_localize(None)
    return df[["Open", "High", "Low", "Close", "Volume"]].dropna()


@st.cache_data(ttl=300)
def run_model(ticker: str, period: str, forecast_days: int) -> dict:
    df        = load_data(ticker, period)
    predictor = GoldPredictor(forecast_days=forecast_days)
    results   = predictor.train(df)
    pred, lo, hi = predictor.predict_future(df)
    results["future_pred"] = pred
    results["future_lower"] = lo
    results["future_upper"] = hi
    results["future_date"]  = df.index[-1] + timedelta(days=forecast_days)
    results["last_price"]   = float(df["Close"].iloc[-1])
    results["last_date"]    = df.index[-1]
    return results


def _rsi(close: pd.Series, n: int = 14) -> pd.Series:
    d    = close.diff()
    gain = d.where(d > 0, 0).rolling(n).mean()
    loss = (-d.where(d < 0, 0)).rolling(n).mean()
    return 100 - 100 / (1 + gain / (loss + 1e-10))


def _macd(close: pd.Series):
    e12 = close.ewm(span=12, adjust=False).mean()
    e26 = close.ewm(span=26, adjust=False).mean()
    m   = e12 - e26
    s   = m.ewm(span=9, adjust=False).mean()
    return m, s, m - s


def fmt(price: float, ticker: str) -> str:
    return f"${price:,.2f}" if ticker == "GC=F" else f"${price:.2f}"


def signal_badge(label: str, kind: str) -> str:
    return f'<span class="signal-badge {kind}">{label}</span>'


# ── Load data ─────────────────────────────────────────────────────────────────
with st.spinner("Fetching data…"):
    df = load_data(ticker, period)

if df.empty:
    st.error("Could not fetch data. Try a different ticker.")
    st.stop()

# ── Key stats ─────────────────────────────────────────────────────────────────
cur   = float(df["Close"].iloc[-1])
prev  = float(df["Close"].iloc[-2])
chg   = cur - prev
chgp  = chg / prev * 100
high52 = float(df["High"].max())
low52  = float(df["Low"].min())
ytd_s  = df[df.index.year == df.index[-1].year]["Close"].iloc[0]
ytd_r  = (cur - ytd_s) / ytd_s * 100

st.title("Gold Price Prediction Dashboard")
st.caption(
    f"Instrument: **{ticker}** · Period: **{period_label}** · "
    f"Last close: **{df.index[-1].strftime('%b %d, %Y')}** · "
    "Data via Yahoo Finance · refreshed every 5 min"
)

c1, c2, c3, c4 = st.columns(4)
c1.metric("Current Price",  fmt(cur,   ticker), f"{chg:+.2f}  ({chgp:+.2f}%)")
c2.metric("52-Week High",   fmt(high52, ticker))
c3.metric("52-Week Low",    fmt(low52,  ticker))
c4.metric("YTD Return",     f"{ytd_r:+.2f}%")

# ── Train model ───────────────────────────────────────────────────────────────
st.markdown("---")
with st.spinner(f"Training model (forecast horizon: {forecast_days} days)…"):
    res = run_model(ticker, period, forecast_days)

fp     = res["future_pred"]
fl     = res["future_lower"]
fu     = res["future_upper"]
fdate  = res["future_date"]
lp     = res["last_price"]
ldate  = res["last_date"]
exp_ch = (fp - cur) / cur * 100

st.subheader(f"{forecast_days}-Day Price Forecast")
p1, p2, p3, p4 = st.columns(4)
p1.metric("Predicted Price",  fmt(fp, ticker), f"{exp_ch:+.2f}%")
p2.metric("Prediction Date",  fdate.strftime("%b %d, %Y"))
p3.metric("90% Lower Bound",  fmt(fl, ticker))
p4.metric("90% Upper Bound",  fmt(fu, ticker))

# ── Compute chart indicators ──────────────────────────────────────────────────
close  = df["Close"]
rsi    = _rsi(close)
macd_l, sig_l, macd_h = _macd(close)

bb_mid = close.rolling(20).mean()
bb_std = close.rolling(20).std()
bb_up  = bb_mid + 2 * bb_std
bb_dn  = bb_mid - 2 * bb_std

ma21  = close.rolling(21).mean()
ma50  = close.rolling(50).mean()
ma200 = close.rolling(200).mean()

# ── Build price chart ─────────────────────────────────────────────────────────
specs = [[{"secondary_y": True}], [{"secondary_y": False}], [{"secondary_y": False}]]
fig = make_subplots(
    rows=3, cols=1,
    shared_xaxes=True,
    vertical_spacing=0.04,
    row_heights=[0.58, 0.21, 0.21],
    subplot_titles=("Price & Indicators", "RSI (14)", "MACD"),
    specs=specs,
)

# Candlestick
fig.add_trace(
    go.Candlestick(
        x=df.index,
        open=df["Open"], high=df["High"],
        low=df["Low"],   close=df["Close"],
        name="Price",
        increasing_line_color="#26a69a", increasing_fillcolor="#26a69a",
        decreasing_line_color="#ef5350", decreasing_fillcolor="#ef5350",
    ),
    row=1, col=1, secondary_y=False,
)

if show_ma:
    for ma, color, label in [
        (ma21,  "#ff9800", "MA 21"),
        (ma50,  "#2196f3", "MA 50"),
        (ma200, "#9c27b0", "MA 200"),
    ]:
        fig.add_trace(
            go.Scatter(x=df.index, y=ma, name=label,
                       line=dict(color=color, width=1.4)),
            row=1, col=1, secondary_y=False,
        )

if show_bb:
    fig.add_trace(
        go.Scatter(
            x=df.index, y=bb_up,
            name="BB Upper",
            line=dict(color="rgba(173,216,230,0.7)", width=1, dash="dot"),
        ),
        row=1, col=1, secondary_y=False,
    )
    fig.add_trace(
        go.Scatter(
            x=df.index, y=bb_dn,
            name="BB Lower",
            line=dict(color="rgba(173,216,230,0.7)", width=1, dash="dot"),
            fill="tonexty",
            fillcolor="rgba(173,216,230,0.07)",
        ),
        row=1, col=1, secondary_y=False,
    )

# Volume bars (secondary y-axis, scaled small)
if show_vol:
    vol_colors = [
        "#26a69a" if c >= o else "#ef5350"
        for c, o in zip(df["Close"], df["Open"])
    ]
    fig.add_trace(
        go.Bar(
            x=df.index, y=df["Volume"],
            name="Volume",
            marker_color=vol_colors,
            opacity=0.25,
            showlegend=True,
        ),
        row=1, col=1, secondary_y=True,
    )

# Prediction cone (last_price → [lower, upper] at future_date)
fig.add_trace(
    go.Scatter(
        x=[ldate, fdate, fdate, ldate],
        y=[lp, fu, fl, lp],
        fill="toself",
        fillcolor="rgba(255,215,0,0.12)",
        line=dict(color="rgba(255,215,0,0.35)", width=1),
        name="90% Confidence",
        hoverinfo="skip",
    ),
    row=1, col=1, secondary_y=False,
)

# Prediction centre line
fig.add_trace(
    go.Scatter(
        x=[ldate, fdate],
        y=[lp, fp],
        mode="lines+markers",
        name=f"Forecast ({fdate.strftime('%b %d')})",
        line=dict(color="#FFD700", width=2, dash="dash"),
        marker=dict(size=[0, 14], color="#FFD700",
                    symbol=["circle", "star"]),
    ),
    row=1, col=1, secondary_y=False,
)

# RSI
fig.add_trace(
    go.Scatter(x=df.index, y=rsi, name="RSI",
               line=dict(color="#e040fb", width=1.5)),
    row=2, col=1,
)
for level, color in [(70, "rgba(239,83,80,0.6)"), (30, "rgba(38,166,154,0.6)"), (50, "rgba(200,200,200,0.25)")]:
    fig.add_hline(y=level, line_dash="dash", line_color=color, row=2, col=1)

# MACD
fig.add_trace(
    go.Bar(
        x=df.index,
        y=macd_h,
        name="MACD Hist",
        marker_color=[
            "#26a69a" if v >= 0 else "#ef5350" for v in macd_h
        ],
        opacity=0.6,
    ),
    row=3, col=1,
)
fig.add_trace(
    go.Scatter(x=df.index, y=macd_l, name="MACD",
               line=dict(color="#2196f3", width=1.5)),
    row=3, col=1,
)
fig.add_trace(
    go.Scatter(x=df.index, y=sig_l, name="Signal",
               line=dict(color="#ff5722", width=1.5)),
    row=3, col=1,
)

fig.update_layout(
    template="plotly_dark",
    height=740,
    showlegend=True,
    legend=dict(orientation="h", yanchor="bottom", y=1.01, xanchor="right", x=1,
                font=dict(size=11)),
    xaxis_rangeslider_visible=False,
    margin=dict(l=0, r=0, t=36, b=0),
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(14,17,23,0.6)",
)
fig.update_yaxes(gridcolor="rgba(200,200,200,0.08)", zerolinecolor="rgba(200,200,200,0.15)")
fig.update_xaxes(gridcolor="rgba(200,200,200,0.08)")
# Hide volume y-axis ticks
fig.update_yaxes(showticklabels=False, secondary_y=True)

st.plotly_chart(fig, use_container_width=True)

# ── Technical signals ─────────────────────────────────────────────────────────
st.subheader("Technical Signals")

cur_rsi  = float(rsi.iloc[-1])
cur_macd = float(macd_l.iloc[-1])
cur_sig  = float(sig_l.iloc[-1])
cur_ma50 = float(ma50.iloc[-1]) if not np.isnan(float(ma50.iloc[-1])) else cur

signals = []
if cur_rsi < 30:
    signals.append(("RSI Oversold", "bullish"))
elif cur_rsi > 70:
    signals.append(("RSI Overbought", "bearish"))
else:
    signals.append(("RSI Neutral", "neutral"))

signals.append(("MACD Bullish" if cur_macd > cur_sig else "MACD Bearish",
                "bullish" if cur_macd > cur_sig else "bearish"))
signals.append(("Above MA 50" if cur > cur_ma50 else "Below MA 50",
                "bullish" if cur > cur_ma50 else "bearish"))
signals.append(("Forecast Up" if fp > cur else "Forecast Down",
                "bullish" if fp > cur else "bearish"))

badges = " ".join(signal_badge(lbl, kind) for lbl, kind in signals)
st.markdown(badges, unsafe_allow_html=True)

# ── Model performance ─────────────────────────────────────────────────────────
st.markdown("---")
left, right = st.columns([1, 2])

with left:
    st.subheader("Model Metrics")
    metrics = res["metrics"]
    rows = []
    for k, v in metrics.items():
        if "%" in k:
            rows.append({"Metric": k, "Value": f"{v:.2f}%"})
        elif k == "R²":
            rows.append({"Metric": k, "Value": f"{v:.4f}"})
        else:
            rows.append({"Metric": k, "Value": fmt(v, ticker)})
    st.dataframe(pd.DataFrame(rows), hide_index=True, use_container_width=True)

    st.caption(
        f"Model: Random Forest (300 trees) · "
        f"Target: price **{forecast_days} days ahead** · "
        "Train/test split: 80 / 20"
    )

with right:
    st.subheader(f"Actual vs Predicted — {forecast_days}-day ahead (test set)")
    tdates = res["test_dates"]
    y_test = res["y_test"]
    y_pred = res["y_pred"]
    lo     = res["lower"]
    hi     = res["upper"]

    fig2 = go.Figure()
    fig2.add_trace(go.Scatter(
        x=tdates, y=hi, line=dict(width=0), showlegend=False,
    ))
    fig2.add_trace(go.Scatter(
        x=tdates, y=lo,
        fill="tonexty",
        fillcolor="rgba(255,165,0,0.12)",
        line=dict(width=0),
        name="80% Confidence",
    ))
    fig2.add_trace(go.Scatter(
        x=tdates, y=y_test,
        name="Actual",
        line=dict(color="#26a69a", width=2),
    ))
    fig2.add_trace(go.Scatter(
        x=tdates, y=y_pred,
        name="Predicted",
        line=dict(color="#FFD700", width=2, dash="dash"),
    ))
    fig2.update_layout(
        template="plotly_dark",
        height=310,
        margin=dict(l=0, r=0, t=8, b=0),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(14,17,23,0.6)",
        legend=dict(orientation="h", y=1.15, font=dict(size=11)),
        yaxis_title=ticker,
    )
    fig2.update_yaxes(gridcolor="rgba(200,200,200,0.08)")
    fig2.update_xaxes(gridcolor="rgba(200,200,200,0.08)")
    st.plotly_chart(fig2, use_container_width=True)

# ── Feature importance ────────────────────────────────────────────────────────
st.subheader("Feature Importances (Top 20)")
fi = res["feature_importance"].head(20)

fig3 = go.Figure(go.Bar(
    x=fi.values[::-1],
    y=fi.index[::-1],
    orientation="h",
    marker=dict(
        color=fi.values[::-1],
        colorscale="YlOrRd",
        showscale=False,
    ),
))
fig3.update_layout(
    template="plotly_dark",
    height=480,
    margin=dict(l=0, r=0, t=8, b=0),
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(14,17,23,0.6)",
    xaxis_title="Importance",
)
fig3.update_xaxes(gridcolor="rgba(200,200,200,0.08)")
st.plotly_chart(fig3, use_container_width=True)

# ── Footer ────────────────────────────────────────────────────────────────────
st.markdown("---")
st.caption(
    "**Disclaimer:** This dashboard is for educational purposes only. "
    "Machine-learning predictions are based on historical price patterns and "
    "do **not** constitute financial advice. Past performance is not indicative of future results."
)

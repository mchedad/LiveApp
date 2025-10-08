"""
Server-Sent Events (SSE) stock ticker demo built with Flask.
Streams random stock price updates to a simple web client.
"""
from __future__ import annotations

import json
import random
import time
from collections import deque
from dataclasses import dataclass, asdict
from typing import Deque, Dict, Generator, Iterable

from flask import Flask, Response, render_template, stream_with_context

app = Flask(__name__)

STOCK_SYMBOLS = ("AAPL", "GOOG", "MSFT", "AMZN")
INITIAL_PRICE_RANGE = (120.0, 250.0)
MAX_HISTORY = 20


@dataclass
class StockQuote:
    symbol: str
    price: float
    change: float
    history: Iterable[float]

    def to_json(self) -> str:
        return json.dumps(
            {
                "symbol": self.symbol,
                "price": round(self.price, 2),
                "change": round(self.change, 2),
                "history": [round(value, 2) for value in self.history],
            }
        )


def _initial_prices() -> Dict[str, Deque[float]]:
    """Generate an initial rolling history for each stock."""
    history: Dict[str, Deque[float]] = {}
    for symbol in STOCK_SYMBOLS:
        price = random.uniform(*INITIAL_PRICE_RANGE)
        history[symbol] = deque([round(price, 2)], maxlen=MAX_HISTORY)
    return history


stock_history = _initial_prices()


def _next_quote(symbol: str) -> StockQuote:
    """Compute the next quote for a symbol with a small random delta."""
    history = stock_history[symbol]
    current_price = history[-1]

    # Simulate percentage change between -0.6% and +0.6%
    change_percent = random.uniform(-0.006, 0.006)
    new_price = max(1.0, current_price * (1 + change_percent))
    change_value = new_price - current_price

    history.append(new_price)
    return StockQuote(symbol=symbol, price=new_price, change=change_value, history=history)


def stock_stream(interval: float = 2.0) -> Generator[str, None, None]:
    """Yield SSE-formatted messages indefinitely with a configurable interval."""
    while True:
        quote = _next_quote(random.choice(STOCK_SYMBOLS))
        payload = quote.to_json()
        event = f"data: {payload}\n\n"
        yield event
        time.sleep(interval)


@app.route("/")
def index() -> str:
    return render_template("index.html", symbols=STOCK_SYMBOLS)


@app.route("/stream")
def stream() -> Response:
    """Stream stock updates using the SSE protocol."""
    generator = stream_with_context(stock_stream())
    response = Response(generator, mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"
    return response


if __name__ == "__main__":
    app.run(debug=True, threaded=True)

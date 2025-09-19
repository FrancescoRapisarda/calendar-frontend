import React, { useState, useEffect } from "react";

type CounterProps = {
  value: number; // il valore finale (es. counters[space])
};

const AnimatedCounter: React.FC<CounterProps> = ({ value }) => {
    const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800; // durata animazione in ms
    const stepTime = Math.max(Math.floor(duration / value), 50); // tempo tra gli step
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= value) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span style={{ fontSize: "2.0rem", fontWeight: "bold" }}>
      {count}
    </span>
  );
};

export default AnimatedCounter;

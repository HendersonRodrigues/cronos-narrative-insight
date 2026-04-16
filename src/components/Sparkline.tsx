import { motion } from "framer-motion";

interface SparklineProps {
  data: number[];
  className?: string;
}

const Sparkline = ({ data, className = "" }: SparklineProps) => {
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 120;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * step,
    y: height - ((v - min) / range) * height,
  }));

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewBox={`0 0 ${width} ${height}`}
      className={`h-8 w-[120px] ${className}`}
      fill="none"
    >
      <path
        d={d}
        stroke="hsl(215 16% 47%)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
};

export default Sparkline;

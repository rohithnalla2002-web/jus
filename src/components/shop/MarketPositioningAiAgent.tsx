import { useId } from "react";
import { motion } from "framer-motion";

/**
 * Full-body AI agent illustration for the landing “Market positioning” block.
 * Pure SVG + Framer Motion - no external assets.
 */
export default function MarketPositioningAiAgent({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const gMetal = `agentMetal-${uid}`;
  const gDark = `agentDark-${uid}`;
  const gVisor = `visor-${uid}`;

  return (
    <div
      className={className ? `relative ${className}` : "relative"}
      role="img"
      aria-label="Animated AI assistant character"
    >
      {/* Ambient orbs */}
      <motion.div
        aria-hidden
        className="absolute -left-4 top-1/4 h-16 w-16 rounded-full bg-fuchsia-400/25 blur-xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -right-2 bottom-1/4 h-20 w-20 rounded-full bg-violet-400/30 blur-xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <motion.div
        className="relative mx-auto w-full max-w-[220px] sm:max-w-[260px]"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className="relative"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
        <svg
          viewBox="0 0 200 340"
          className="h-auto w-full drop-shadow-[0_20px_40px_rgba(91,33,182,0.2)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <linearGradient id={gMetal} x1="60" y1="0" x2="140" y2="200" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8b5cf6" />
              <stop offset="0.5" stopColor="#a78bfa" />
              <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id={gDark} x1="100" y1="40" x2="100" y2="280" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4c1d95" />
              <stop offset="1" stopColor="#6d28d9" />
            </linearGradient>
            <linearGradient id={gVisor} x1="70" y1="48" x2="130" y2="88" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22d3ee" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Shadow under feet */}
          <ellipse cx="100" cy="318" rx="52" ry="8" fill={`url(#${gMetal})`} opacity="0.15" />

          {/* Legs */}
          <motion.g
            style={{ transformOrigin: "100px 200px" }}
            animate={{ rotate: [0, 1.5, 0, -1.5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <path
              d="M78 210 L72 290 L84 308 L92 308 L88 210 Z"
              fill={`url(#${gDark})`}
              stroke="#5b21b6"
              strokeWidth="1"
              strokeOpacity="0.35"
            />
            <path
              d="M122 210 L128 290 L116 308 L108 308 L112 210 Z"
              fill={`url(#${gDark})`}
              stroke="#5b21b6"
              strokeWidth="1"
              strokeOpacity="0.35"
            />
            {/* Feet */}
            <ellipse cx="78" cy="308" rx="18" ry="8" fill="#4c1d95" />
            <ellipse cx="122" cy="308" rx="18" ry="8" fill="#4c1d95" />
          </motion.g>

          {/* Torso */}
          <motion.g
            animate={{ scaleY: [1, 1.02, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "100px 160px" }}
          >
            <rect x="56" y="120" width="88" height="100" rx="16" fill={`url(#${gMetal})`} stroke="#6d28d9" strokeWidth="2" />
            <rect x="68" y="136" width="64" height="36" rx="8" fill="#1e1b4b" opacity="0.85" />
            <text x="100" y="158" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="system-ui, sans-serif">
              AI
            </text>
            <circle cx="100" cy="188" r="6" fill="#34d399" opacity="0.9">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </circle>
          </motion.g>

          {/* Left arm (relaxed) */}
          <motion.g
            style={{ transformOrigin: "56px 135px" }}
            animate={{ rotate: [0, 4, 0, -2, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <path
              d="M56 130 L28 175 L32 188 L48 182 L58 145 Z"
              fill={`url(#${gDark})`}
              stroke="#5b21b6"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <circle cx="26" cy="188" r="10" fill="#7c3aed" stroke="#a78bfa" strokeWidth="2" />
          </motion.g>

          {/* Right arm (wave) */}
          <motion.g
            style={{ transformOrigin: "144px 132px" }}
            animate={{ rotate: [0, -22, -12, -28, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
          >
            <path
              d="M144 128 L175 95 L188 102 L168 135 L150 142 Z"
              fill={`url(#${gDark})`}
              stroke="#5b21b6"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <circle cx="182" cy="92" r="11" fill="#7c3aed" stroke="#c4b5fd" strokeWidth="2" />
          </motion.g>

          {/* Neck */}
          <rect x="88" y="108" width="24" height="18" rx="6" fill="#5b21b6" />

          {/* Head */}
          <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
            <rect x="62" y="48" width="76" height="68" rx="22" fill={`url(#${gMetal})`} stroke="#6d28d9" strokeWidth="2" />
            <rect x="70" y="58" width="60" height="32" rx="10" fill={`url(#${gVisor})`} opacity="0.95" />
            <motion.ellipse
              cx="88"
              cy="74"
              rx="5"
              ry="7"
              fill="#e0f2fe"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.ellipse
              cx="112"
              cy="74"
              rx="5"
              ry="7"
              fill="#e0f2fe"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
            />
            {/* Antenna */}
            <motion.line
              x1="100"
              y1="48"
              x2="100"
              y2="28"
              stroke="#a78bfa"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <motion.circle
              cx="100"
              cy="22"
              r="6"
              fill="#f472b6"
              animate={{ scale: [1, 1.2, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.g>
        </svg>
        </motion.div>
      </motion.div>

      {/* Sparkle particles */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-violet-400"
          style={{
            left: `${18 + i * 14}%`,
            top: `${12 + (i % 3) * 22}%`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [0.6, 1.2, 0.6],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

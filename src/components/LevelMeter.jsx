const BARS = 24;

const LevelMeter = ({ level, active }) => (
  <div className={`level-meter ${active ? 'is-active' : ''}`} aria-hidden="true">
    {Array.from({ length: BARS }, (_, index) => {
      const distance = Math.abs(index - (BARS - 1) / 2) / (BARS / 2);
      const height = active ? Math.max(0.08, level * (1 - distance * 0.7) + Math.random() * level * 0.25) : 0.08;
      return <span key={index} style={{ transform: `scaleY(${Math.min(1, height)})` }} />;
    })}
  </div>
);

export default LevelMeter;

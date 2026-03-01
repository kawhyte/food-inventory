interface DoodleStarProps {
  color: string;
  size: number;
}

export function DoodleStar({ color, size }: DoodleStarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 12.4 1.7 L 14.8 8.4 L 21.9 8.6 L 15.7 13.4 L 18.3 20.2 L 11.8 15.9 L 5.8 20.4 L 8.0 13.1 L 2.3 9.1 L 9.4 9.0 Z" />
    </svg>
  );
}

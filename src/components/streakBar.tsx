import { useEffect, useState } from "react";
import { Rect, Group, Text } from "react-konva";
import { events } from "../shared/events";

export function StreakBar() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onStreakActivated = ({
      value,
      progress,
    }: {
      value: boolean;
      progress: number;
    }) => {
      console.log("Streak active:", value, "progress:", progress);
      setActive(value);
      setProgress(progress);
    };
    events.on("StreakActivated", onStreakActivated);
    return () => {
      events.off("StreakActivated", onStreakActivated);
    };
  }, []);
  return (
    <>
      {active && (
        <Group x={20} y={20}>
          <Rect width={200} height={20} fill="#333" cornerRadius={10} />
          <Rect
            width={200 * progress}
            height={20}
            fill="#FFD700"
            cornerRadius={10}
          />
          <Text
            x={0}
            y={-20}
            text={`🔥 Streak! ${Math.round(progress * 100)}%`}
            fontSize={16}
            fill="#FFD700"
          />
        </Group>
      )}
    </>
  );
}

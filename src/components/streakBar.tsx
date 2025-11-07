import { useEffect, useState } from "react";
import { Rect, Group, Text } from "react-konva";
import { StreakController } from "../game/controllers/StreakController";

interface StreakBarProps {
  streakController: StreakController;
}

export const StreakBar: React.FC<StreakBarProps> = ({ streakController }) => {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let animationFrame: number;

    const update = () => {
      setProgress(streakController.getGauge() / 100);
      setActive(streakController.getState() === "active");
      animationFrame = requestAnimationFrame(update);
    };

    update(); // start loop

    return () => cancelAnimationFrame(animationFrame);
  }, [streakController]);

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
};

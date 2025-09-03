import {
  useCallback,
  useRef,
  useEffect,
  MouseEventHandler,
  PropsWithChildren,
  useMemo,
} from "react";

import { Theme } from "src/themes";

type Coord = [number, number];

const smoothingFactor = 0.9;
let idleEventId = 0;

export const Home = ({
  children,
  title = "Billit",
}: PropsWithChildren<{ title?: string }>) => {
  const titleRef = useRef<HTMLDivElement>(null);

  const renderedTitle = useMemo(
    () =>
      title.split("").map((char, index) => (
        <span key={`char-${index}-${char}`} className="char-shade">
          {char}
        </span>
      )),
    []
  );

  const mousePositions = useRef<Coord[]>([
    [window.outerWidth / 2, window.outerHeight / 2],
  ]);
  const toBeShadedOrNotToBeShaded = useRef<Array<[Element, DOMRect]>>([]);

  const smoothMousePosition = useCallback((): Coord => {
    const positions = mousePositions.current;
    const current = positions.at(-1);
    if (positions.length < 2 || !current) return [0, 0];

    let [smoothedX, smoothedY] = current;

    for (let i = 1; i < positions.length; i++) {
      const [x, y] = positions[i];
      smoothedX = smoothedX + smoothingFactor * (x - smoothedX);
      smoothedY = smoothedY + smoothingFactor * (y - smoothedY);
    }

    return [smoothedX, smoothedY];
  }, [mousePositions]);

  const drawShadows = useCallback(() => {
    const [smoothedX, smoothedY] = smoothMousePosition();
    const dia = window.innerWidth + window.innerHeight;

    // Update shadows for each character in shade-text elements
    for (const [charElm, boundingBox] of toBeShadedOrNotToBeShaded.current) {
      const { height, width, x, y } = boundingBox;

      // Calculate shadow direction and distance based on cursor position
      const dx = smoothedX - (x + width / 2); // Distance from cursor to character (x-axis)
      const dy = smoothedY - (y + height / 2); // Distance from cursor to character (y-axis)

      const distance = Math.min(Math.sqrt(dx * dx + dy * dy));
      // const shadowLength = distance / Math.sin(distance);
      const shadowLength = distance / 10;

      // Calculate shadow direction (dx, dy already give us the direction)
      const shadowX = (dx / distance) * shadowLength || 0; // Avoid division by zero
      const shadowY = (dy / distance) * shadowLength || 0;

      const floatDistance = distance / dia;

      const spread = Math.sin(floatDistance) * 1000;
      // const spread = Math.min(40, floatDistance * (100 + (distance / 5) * 20));
      const opacity = 1; // 1 - floatDistance;
      const hue = 200 + Math.floor(floatDistance * 360 * 5);
      const lightness = 80; // 50 - Math.abs(floatDistance * 50);

      const color = `hsl(${hue} ${lightness}% 60%)`;
      const shadow = `${shadowX}px ${shadowY}px ${spread}px ${color}`;
      // @ts-ignore
      charElm.style.textShadow = `${shadow}, ${shadow}`;
    }
  }, [toBeShadedOrNotToBeShaded]);

  const onDraw: MouseEventHandler<any> = useCallback(
    ({ clientX, clientY }) => {
      if (!toBeShadedOrNotToBeShaded.current.length) {
        return;
      }

      mousePositions.current.push([clientX, clientY]);
      if (mousePositions.current.length > 150) {
        mousePositions.current.shift();
      }

      requestAnimationFrame(drawShadows);
    },
    [mousePositions, toBeShadedOrNotToBeShaded, drawShadows]
  );

  const onTextHover: MouseEventHandler<any> = useCallback(
    (e) => {
      window.clearTimeout(idleEventId);
      window.cancelAnimationFrame(idleEventId);

      onDraw(e);
      startIdle();
    },
    [toBeShadedOrNotToBeShaded.current]
  );

  const idleHover = useCallback(() => {
    if (!toBeShadedOrNotToBeShaded.current.length || !titleRef.current) {
      return;
    }
    const rect = titleRef.current.getBoundingClientRect();
    const loopSpeed = 0.01;
    const radiusX = rect.width / 2;
    const radiusY = rect.height / 2;

    let [cx, cy] = smoothMousePosition();
    if (!cx) {
      cx = rect.x + radiusX;
      cy = rect.y + radiusY;
    }

    let i = 0;
    const loop = () => {
      const angle = i * loopSpeed;
      const angle2 = (i * loopSpeed) / 100;

      const x = cx + radiusX * Math.cos(angle) * Math.sinh(angle2);
      const y = cy + radiusY * Math.sin(angle) * Math.cosh(angle2);

      onDraw({ clientX: x, clientY: y } as any);
      idleEventId = requestAnimationFrame(loop);
      i++;
    };

    idleEventId = requestAnimationFrame(loop);
  }, [titleRef.current, smoothMousePosition]);

  const startIdle = () => {
    window.clearTimeout(idleEventId);
    window.cancelAnimationFrame(idleEventId);
    idleEventId = window.setTimeout(idleHover, 100);
  };

  useEffect(() => {
    if (titleRef.current) {
      // get all the exact coordinates of the char elementzz
      toBeShadedOrNotToBeShaded.current = [
        ...titleRef.current.getElementsByClassName("char-shade"),
      ].map<[Element, DOMRect]>(
        (charElm) =>
          [charElm, charElm.getBoundingClientRect()] as [Element, DOMRect]
      );
    }
    startIdle();
  }, [renderedTitle]);

  return (
    <Theme className="h-full w-full" isDarkMode={true}>
      <div
        className="w-ful h-full items-center flex justify-center"
        onMouseMove={onTextHover}
      >
        <div className="flex flex-col justify-center items-center">
          <div
            ref={titleRef}
            className="font-black font-title text-[#fff9] stroke-2 stroke-red"
            style={{
              letterSpacing: 18,
              fontSize: 160,
            }}
          >
            {renderedTitle}
          </div>
          {children}
        </div>
      </div>
    </Theme>
  );
};

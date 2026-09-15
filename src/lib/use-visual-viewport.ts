import { useEffect, useState } from "react";

export function useVisualViewport() {
  const [box, setBox] = useState({ height: 640, top: 0 });

  useEffect(() => {
    const sync = () => {
      const vv = window.visualViewport;
      if (vv) setBox({ height: Math.round(vv.height), top: Math.round(vv.offsetTop) });
      else setBox({ height: window.innerHeight, top: 0 });
    };
    sync();
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return box;
}

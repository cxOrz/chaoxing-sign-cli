import { useRef, useEffect } from 'react';

export const useLongPress = (cb: (pos: { x: number, y: number }) => void, delay: number) => {
  const ref = useRef<HTMLDivElement>(null);

  let timer: any = null;

  useEffect(() => {
    // 只针对iOS的Safari浏览器
    if (window.navigator.userAgent.includes('iPhone') || window.navigator.userAgent.includes('iPad')) {
      ref.current!.ontouchstart = function (e) {
        timer = setTimeout(() => {
          // 执行回调函数
          cb({ x: e.touches[0].clientX, y: e.touches[0].clientY });
          timer = null;
        }, delay);
      };
      ref.current!.ontouchend = function (e) {
        if (timer) clearTimeout(timer);
        else e.preventDefault();
      };
    }
  }, [ref]);

  return [ref] as const;
};

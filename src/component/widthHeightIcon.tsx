import { IconToLeft, IconToRight } from "@arco-design/web-react/icon"

export const IconWidth = () => {
  return (
    <span>
      <IconToLeft style={{ transform: 'scale(0.8)' }} />
      <IconToRight style={{ transform: 'translateX(-20%) scale(0.8)' }}/> {/* render issue if use -0.2 */}
    </span>
  );
};

export const IconHeight = () => {
  return (
    <span>
      <IconToLeft style={{ transform: 'scale(0.8) rotate(90deg)', transformOrigin: 'right' }} />
      <IconToRight style={{ transform: 'scale(0.8) rotate(90deg)', transformOrigin: 'left' }} />
    </span>
  );
}

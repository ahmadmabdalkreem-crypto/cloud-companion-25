import { memo, useCallback, useRef, useState, type ImgHTMLAttributes } from "react";

type LazyImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Wrapper class (holds the blur placeholder). */
  wrapperClassName?: string;
  /** Skip lazy loading for above-the-fold/LCP images. */
  priority?: boolean;
};

/**
 * Image with native lazy loading, async decoding and a lightweight
 * blur/shimmer placeholder that cross-fades once the bitmap is ready.
 * Memoised so parent state changes never re-render the <img>.
 */
function LazyImageBase({
  wrapperClassName = "",
  priority = false,
  className = "",
  onLoad,
  ...props
}: LazyImageProps) {
  const ref = useRef<HTMLImageElement | null>(null);
  // If the image came from cache it may already be complete before onLoad fires.
  const [loaded, setLoaded] = useState(false);

  const handleRef = useCallback((node: HTMLImageElement | null) => {
    ref.current = node;
    if (node?.complete && node.naturalWidth > 0) setLoaded(true);
  }, []);

  const handleLoad = useCallback<NonNullable<LazyImageProps["onLoad"]>>(
    (e) => {
      setLoaded(true);
      onLoad?.(e);
    },
    [onLoad],
  );

  return (
    <span
      className={`img-frame ${loaded ? "is-loaded" : ""} ${wrapperClassName}`}
      aria-hidden={props.alt === "" ? true : undefined}
    >
      <img
        {...props}
        ref={handleRef}
        onLoad={handleLoad}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={`img-fade ${className}`}
      />
    </span>
  );
}

export const LazyImage = memo(LazyImageBase);

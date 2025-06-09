import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook that detects when an element enters the viewport.
 * @param {Object} options - Intersection Observer options (threshold, root, rootMargin).
 * @returns {[React.RefObject, boolean]} - A ref to attach to the element and a boolean indicating if it's intersecting.
 */
const useIntersectionObserver = (options = { threshold: 0.1, triggerOnce: true }) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const element = ref.current;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsIntersecting(true);
                if (options.triggerOnce) {
                    observer.unobserve(entry.target);
                }
            }
        }, options);

        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [options]);

    return [ref, isIntersecting];
};

export default useIntersectionObserver; 
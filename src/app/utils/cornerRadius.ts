/**
 * Utility functions for calculating nested corner radius
 */

export interface CornerRadius {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}

/**
 * Calculate pill-shaped corner radius (fully rounded)
 */
export const getPillRadius = (height: number): CornerRadius => ({
  topLeft: height / 2,
  topRight: height / 2,
  bottomLeft: height / 2,
  bottomRight: height / 2,
});

/**
 * Calculate rounded rectangle corner radius
 */
export const getRoundedRectangleRadius = (height: number, radius: number = 12): CornerRadius => ({
  topLeft: radius,
  topRight: radius,
  bottomLeft: radius,
  bottomRight: radius,
});

/**
 * Calculate outer radius based on inner radius and padding
 * Used when you have an inner element and want to calculate the outer container's radius
 */
export const calculateOuterRadius = (
  innerRadius: CornerRadius,
  padding: number
): CornerRadius => {
  return {
    topLeft: Math.max(0, innerRadius.topLeft - padding),
    topRight: Math.max(0, innerRadius.topRight - padding),
    bottomLeft: Math.max(0, innerRadius.bottomLeft - padding),
    bottomRight: Math.max(0, innerRadius.bottomRight - padding),
  };
};

/**
 * Calculate inner radius based on outer radius and padding
 * Used when you have an outer container and want to calculate the inner element's radius
 */
export const calculateInnerRadius = (
  outerRadius: CornerRadius,
  padding: number
): CornerRadius => {
  return {
    topLeft: outerRadius.topLeft + padding,
    topRight: outerRadius.topRight + padding,
    bottomLeft: outerRadius.bottomLeft + padding,
    bottomRight: outerRadius.bottomRight + padding,
  };
};

/**
 * Calculate nested corner radius for toolbar with specific corners
 * Legacy function for backward compatibility
 */
export const getToolbarRadius = (height: number, isActive: boolean = false): CornerRadius => {
  const baseRadius = height / 2;
  const activeRadius = 12;
  
  return {
    topLeft: baseRadius, // Maintain pill shape on left
    topRight: isActive ? activeRadius : baseRadius,
    bottomLeft: baseRadius, // Maintain pill shape on left
    bottomRight: isActive ? activeRadius : baseRadius,
  };
};

/**
 * Convert corner radius object to CSS border-radius string
 */
export const cornerRadiusToCSS = (radius: CornerRadius): string => {
  return `${radius.topLeft}px ${radius.topRight}px ${radius.bottomRight}px ${radius.bottomLeft}px`;
};

/**
 * Calculate transition duration based on distance
 */
export const getTransitionDuration = (fromRadius: CornerRadius, toRadius: CornerRadius): number => {
  const maxChange = Math.max(
    Math.abs(fromRadius.topRight - toRadius.topRight),
    Math.abs(fromRadius.bottomRight - toRadius.bottomRight),
    Math.abs(fromRadius.topLeft - toRadius.topLeft),
    Math.abs(fromRadius.bottomLeft - toRadius.bottomLeft)
  );
  // Base duration of 200ms, scale with change amount
  return Math.max(150, Math.min(300, 200 + maxChange * 2));
};

/**
 * Create a nested radius system for complex layouts
 * Allows specifying which corners should inherit, be calculated, or be fixed
 */
export interface NestedRadiusConfig {
  topLeft?: 'inherit' | 'calculate' | number;
  topRight?: 'inherit' | 'calculate' | number;
  bottomLeft?: 'inherit' | 'calculate' | number;
  bottomRight?: 'inherit' | 'calculate' | number;
  padding?: number;
  baseRadius?: number;
}

export const createNestedRadius = (
  config: NestedRadiusConfig,
  parentRadius?: CornerRadius,
  isActive: boolean = false
): CornerRadius => {
  const { padding = 0, baseRadius = 12 } = config;
  
  return {
    topLeft: config.topLeft === 'inherit' ? 0 : 
             config.topLeft === 'calculate' ? (parentRadius?.topLeft || 0) + padding :
             config.topLeft || baseRadius,
    topRight: config.topRight === 'inherit' ? 0 :
              config.topRight === 'calculate' ? (parentRadius?.topRight || 0) + padding :
              config.topRight || (isActive ? baseRadius : baseRadius * 2),
    bottomLeft: config.bottomLeft === 'inherit' ? 0 :
                config.bottomLeft === 'calculate' ? (parentRadius?.bottomLeft || 0) + padding :
                config.bottomLeft || baseRadius,
    bottomRight: config.bottomRight === 'inherit' ? 0 :
                 config.bottomRight === 'calculate' ? (parentRadius?.bottomRight || 0) + padding :
                 config.bottomRight || (isActive ? baseRadius : baseRadius * 2),
  };
};

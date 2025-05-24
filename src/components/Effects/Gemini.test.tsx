import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { motion, useMotionValue, MotionValue } from 'framer-motion'; // Import motion and useMotionValue
import { GoogleGeminiEffect } from './Gemini'; 

// We are not mocking framer-motion for these tests, as we want to test
// the actual props being passed to the motion.path elements, especially 'stroke'.

describe('GoogleGeminiEffect', () => {
  // Helper to create mock MotionValue array
  const createMockPathLengths = (): MotionValue<number>[] => 
    Array(5).fill(null).map(() => useMotionValue(0));

  const defaultColors = ["#FFB7C5", "#FFDDB7", "#B1C5FF", "#4FABFF", "#076EFF"];

  it('renders correctly with default props and applies default colors', () => {
    const mockPathLengths = createMockPathLengths();
    render(<GoogleGeminiEffect pathLengths={mockPathLengths} />);
    
    // Check if the SVG container is rendered (by role, more robust than checking for specific class)
    expect(screen.getByRole('graphics-document')).toBeInTheDocument(); 
    
    // Check if paths are rendered with default colors
    for (let i = 0; i < 5; i++) {
      const pathElement = screen.getByTestId(`gemini-motion-path-${i}`);
      expect(pathElement).toBeInTheDocument();
      expect(pathElement).toHaveAttribute('stroke', defaultColors[i % defaultColors.length]);
    }
  });

  it('applies custom colors when provided (5 colors)', () => {
    const mockPathLengths = createMockPathLengths();
    const customColors = ["#AAAAAA", "#BBBBBB", "#CCCCCC", "#DDDDDD", "#EEEEEE"];
    render(<GoogleGeminiEffect pathLengths={mockPathLengths} colors={customColors} />);
    
    for (let i = 0; i < 5; i++) {
      const pathElement = screen.getByTestId(`gemini-motion-path-${i}`);
      expect(pathElement).toBeInTheDocument();
      expect(pathElement).toHaveAttribute('stroke', customColors[i % customColors.length]);
    }
  });

  it('applies custom colors and cycles if fewer than 5 colors are provided (e.g., 3 colors)', () => {
    const mockPathLengths = createMockPathLengths();
    const customColors = ["#FF0000", "#00FF00", "#0000FF"]; // 3 colors
    render(<GoogleGeminiEffect pathLengths={mockPathLengths} colors={customColors} />);
    
    // Paths 0, 1, 2 get colors 0, 1, 2
    // Path 3 gets color 0 (customColors[3 % 3])
    // Path 4 gets color 1 (customColors[4 % 3])
    const expectedStrokes = [
      customColors[0], 
      customColors[1], 
      customColors[2], 
      customColors[0], 
      customColors[1]
    ];

    for (let i = 0; i < 5; i++) {
      const pathElement = screen.getByTestId(`gemini-motion-path-${i}`);
      expect(pathElement).toBeInTheDocument();
      expect(pathElement).toHaveAttribute('stroke', expectedStrokes[i]);
    }
  });
  
  it('falls back to default colors if provided colors array is invalid (e.g., < 3 colors)', () => {
    const mockPathLengths = createMockPathLengths();
    const invalidCustomColors = ["#AAAAAA", "#BBBBBB"]; // Only 2 colors
    render(<GoogleGeminiEffect pathLengths={mockPathLengths} colors={invalidCustomColors} />);
    
    for (let i = 0; i < 5; i++) {
      const pathElement = screen.getByTestId(`gemini-motion-path-${i}`);
      expect(pathElement).toBeInTheDocument();
      expect(pathElement).toHaveAttribute('stroke', defaultColors[i % defaultColors.length]);
    }
  });


  it('renders without error with different animationSpeed props', () => {
    const mockPathLengths = createMockPathLengths();
    // Render with 'slow'
    const { unmount: unmountSlow } = render(<GoogleGeminiEffect pathLengths={mockPathLengths} animationSpeed="slow" />);
    expect(screen.getByRole('graphics-document')).toBeInTheDocument(); 
    unmountSlow();

    // Render with 'fast'
    const { unmount: unmountFast } = render(<GoogleGeminiEffect pathLengths={mockPathLengths} animationSpeed="fast" />);
    expect(screen.getByRole('graphics-document')).toBeInTheDocument(); 
    unmountFast();
    
    // Render with 'medium' (default behavior if prop is undefined or invalid, but testing explicit value)
    const { unmount: unmountMedium } = render(<GoogleGeminiEffect pathLengths={mockPathLengths} animationSpeed="medium" />);
    expect(screen.getByRole('graphics-document')).toBeInTheDocument(); 
    unmountMedium();
  });

  it('renders without error with different animationIntensity props', () => {
    const mockPathLengths = createMockPathLengths();
    // Render with 'calm'
    const { unmount: unmountCalm } = render(<GoogleGeminiEffect pathLengths={mockPathLengths} animationIntensity="calm" />);
    expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    unmountCalm();

    // Render with 'energetic'
    const { unmount: unmountEnergetic } = render(<GoogleGeminiEffect pathLengths={mockPathLengths} animationIntensity="energetic" />);
    expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    unmountEnergetic();

    // Render with 'moderate' (default behavior if prop is undefined or invalid, but testing explicit value)
    const { unmount: unmountModerate } = render(<GoogleGeminiEffect pathLengths={mockPathLengths} animationIntensity="moderate" />);
    expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    unmountModerate();
  });

  // Note: Directly testing the `duration` and `ease` of the path animation
  // is complex because the `pathLength` style is driven by external MotionValues
  // and the component's internal transition for this style is set to `duration: 0`
  // for instant updates. The props `animationSpeed` and `animationIntensity`
  // calculate internal `finalDuration` and `selectedEase`, but these wouldn't
  // affect the path drawing animation itself in the current setup.
  // The tests above ensure the component renders correctly and applies colors
  // when these props are varied.
});

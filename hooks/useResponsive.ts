// hooks/useResponsive.ts

import { useWindowDimensions } from "react-native";

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isLargeTablet = width >= 1024;

  const isLandscape = width > height;
  const isPortrait = height > width;

  const horizontalScale = width / 390; // base width para phones
  const verticalScale = height / 844; // base height para phones

  const normalize = (size: number) => {
    return Math.round(size * horizontalScale);
  };

  const normalizeHeight = (size: number) => {
    return Math.round(size * verticalScale);
  };

  // Tamanhos dinâmicos de fonte
  const fontSize = {
    xs: normalize(10),
    sm: normalize(12),
    base: normalize(14),
    lg: normalize(16),
    xl: normalize(18),
    "2xl": normalize(20),
    "3xl": normalize(24),
    "4xl": normalize(28),
    "5xl": normalize(32),
  };

  // Espaçamentos dinâmicos
  const spacing = {
    xs: normalize(4),
    sm: normalize(8),
    md: normalize(12),
    lg: normalize(16),
    xl: normalize(20),
    "2xl": normalize(24),
    "3xl": normalize(32),
  };

  // Padding diferente por tamanho de device
  const containerPadding = isTablet ? spacing["2xl"] : spacing.lg;
  const cardPadding = isTablet ? spacing.xl : spacing.lg;
  const horizontalPadding = isTablet ? spacing["2xl"] : spacing.lg;

  // Dimensões dinâmicas
  const cardWidth =
    isTablet || isLargeTablet
      ? (width - spacing["2xl"] * 2) / 2
      : width - spacing.lg * 2;
  const buttonHeight = normalize(48);
  const iconSize = isTablet ? normalize(32) : normalize(28);

  return {
    width,
    height,
    isPhone,
    isTablet,
    isLargeTablet,
    isLandscape,
    isPortrait,
    fontSize,
    spacing,
    normalize,
    normalizeHeight,
    containerPadding,
    cardPadding,
    horizontalPadding,
    cardWidth,
    buttonHeight,
    iconSize,
  };
};

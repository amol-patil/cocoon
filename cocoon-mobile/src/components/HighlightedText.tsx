import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { type FuseResultMatch } from 'fuse.js';
import { colors } from '../theme/colors';

interface Props {
  text: string;
  matches?: readonly FuseResultMatch[];
  fieldKey: string;
  style: StyleProp<TextStyle>;
  highlightColor?: string;
  numberOfLines?: number;
}

export function HighlightedText({
  text,
  matches,
  fieldKey,
  style,
  highlightColor = colors.accentPrimary,
  numberOfLines,
}: Props) {
  const fieldMatches = matches?.filter((m) => m.key === fieldKey);

  if (!fieldMatches || fieldMatches.length === 0) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  // Collect all match index ranges for this field
  const ranges: [number, number][] = [];
  for (const match of fieldMatches) {
    if (match.indices) {
      for (const [start, end] of match.indices) {
        ranges.push([start, end]);
      }
    }
  }

  if (ranges.length === 0) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  // Sort ranges and merge overlaps
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const prev = merged[merged.length - 1];
    if (ranges[i][0] <= prev[1] + 1) {
      prev[1] = Math.max(prev[1], ranges[i][1]);
    } else {
      merged.push(ranges[i]);
    }
  }

  // Build text segments
  const segments: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < merged.length; i++) {
    const [start, end] = merged[i];
    if (cursor < start) {
      segments.push(<Text key={`n${i}`}>{text.slice(cursor, start)}</Text>);
    }
    segments.push(
      <Text key={`h${i}`} style={{ color: highlightColor }}>
        {text.slice(start, end + 1)}
      </Text>
    );
    cursor = end + 1;
  }
  if (cursor < text.length) {
    segments.push(<Text key="tail">{text.slice(cursor)}</Text>);
  }

  return <Text style={style} numberOfLines={numberOfLines}>{segments}</Text>;
}

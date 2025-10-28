/**
 * Unit tests for Track serialization methods
 */

import { Track, TrackJSON } from '../../src/game/models/track';

describe('Track Serialization', () => {
  // Helper function to create a simple test track
  const createTestTrack = (): Track => {
    const trackJSON: TrackJSON = {
      version: 1,
      width: 20,
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ],
      smoothIterations: 1,
      sampleSpacing: 10
    };
    return Track.fromJSON(trackJSON);
  };

  describe('toSerializedData', () => {
    it('should serialize track properties correctly', () => {
      // Arrange
      const track = createTestTrack();

      // Act
      const serialized = track.toSerializedData();

      // Assert
      expect(serialized).toHaveProperty('width');
      expect(serialized).toHaveProperty('samples');
      expect(serialized).toHaveProperty('sTable');
      expect(serialized).toHaveProperty('totalLength');
      
      expect(typeof serialized.width).toBe('number');
      expect(Array.isArray(serialized.samples)).toBe(true);
      expect(Array.isArray(serialized.sTable)).toBe(true);
      expect(typeof serialized.totalLength).toBe('number');
      
      expect(serialized.width).toBe(20);
      expect(serialized.samples.length).toBeGreaterThan(0);
      expect(serialized.sTable).toHaveLength(serialized.samples.length);
      expect(serialized.totalLength).toBeGreaterThan(0);
    });

    it('should serialize samples as Vec2 objects', () => {
      // Arrange
      const track = createTestTrack();

      // Act
      const serialized = track.toSerializedData();

      // Assert
      serialized.samples.forEach(sample => {
        expect(sample).toHaveProperty('x');
        expect(sample).toHaveProperty('y');
        expect(typeof sample.x).toBe('number');
        expect(typeof sample.y).toBe('number');
      });
    });

    it('should serialize sTable as array of numbers', () => {
      // Arrange
      const track = createTestTrack();

      // Act
      const serialized = track.toSerializedData();

      // Assert
      expect(serialized.sTable.every(s => typeof s === 'number')).toBe(true);
      expect(serialized.sTable[0]).toBe(0); // Should start at 0
      expect(serialized.sTable[serialized.sTable.length - 1]).toBe(serialized.totalLength);
    });

    it('should handle different track configurations', () => {
      // Arrange - create tracks with different properties
      const configs = [
        { width: 10, smoothIterations: 0, sampleSpacing: 5 },
        { width: 50, smoothIterations: 3, sampleSpacing: 1 },
        { width: 100, smoothIterations: 5, sampleSpacing: 20 }
      ];

      configs.forEach(config => {
        const trackJSON: TrackJSON = {
          version: 1,
          width: config.width,
          points: [
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 50 },
            { x: 0, y: 50 }
          ],
          smoothIterations: config.smoothIterations,
          sampleSpacing: config.sampleSpacing
        };
        const track = Track.fromJSON(trackJSON);

        // Act
        const serialized = track.toSerializedData();

        // Assert
        expect(serialized.width).toBe(config.width);
        expect(serialized.samples.length).toBeGreaterThan(3); // At least as many as input points
        expect(serialized.totalLength).toBeGreaterThan(0);
      });
    });
  });

  describe('fromSerializedData', () => {
    it('should deserialize track data correctly', () => {
      // Arrange
      const originalTrack = createTestTrack();
      const serializedData = originalTrack.toSerializedData();

      // Act
      const deserializedTrack = Track.fromSerializedData(serializedData);

      // Assert
      expect(deserializedTrack.width).toBe(originalTrack.width);
      expect(deserializedTrack.length).toBe(originalTrack.length);
      expect(deserializedTrack.getSamples()).toHaveLength(originalTrack.getSamples().length);
    });

    it('should preserve exact sample data', () => {
      // Arrange
      const originalTrack = createTestTrack();
      const serializedData = originalTrack.toSerializedData();

      // Act
      const deserializedTrack = Track.fromSerializedData(serializedData);

      // Assert
      const originalSamples = originalTrack.getSamples();
      const deserializedSamples = deserializedTrack.getSamples();
      
      expect(deserializedSamples).toHaveLength(originalSamples.length);
      
      for (let i = 0; i < originalSamples.length; i++) {
        expect(deserializedSamples[i].x).toBeCloseTo(originalSamples[i].x, 10);
        expect(deserializedSamples[i].y).toBeCloseTo(originalSamples[i].y, 10);
      }
    });

    it('should handle minimal track data', () => {
      // Arrange
      const minimalData = {
        width: 15,
        samples: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
          { x: 0, y: 0 } // Closed loop
        ],
        sTable: [0, 10, 20, 30, 40],
        totalLength: 40
      };

      // Act
      const track = Track.fromSerializedData(minimalData);

      // Assert
      expect(track.width).toBe(15);
      expect(track).toHaveLength(40);
      expect(track.getSamples()).toHaveLength(5);
    });
  });

  describe('Serialization Round-trip', () => {
    it('should maintain data integrity through serialize/deserialize cycle', () => {
      // Arrange
      const originalTrack = createTestTrack();

      // Act
      const serialized = originalTrack.toSerializedData();
      const deserializedTrack = Track.fromSerializedData(serialized);
      const reSerialized = deserializedTrack.toSerializedData();

      // Assert
      expect(reSerialized.width).toBe(serialized.width);
      expect(reSerialized.totalLength).toBeCloseTo(serialized.totalLength, 10);
      expect(reSerialized.samples).toHaveLength(serialized.samples.length);
      expect(reSerialized.sTable).toHaveLength(serialized.sTable.length);

      // Check samples match
      for (let i = 0; i < serialized.samples.length; i++) {
        expect(reSerialized.samples[i].x).toBeCloseTo(serialized.samples[i].x, 10);
        expect(reSerialized.samples[i].y).toBeCloseTo(serialized.samples[i].y, 10);
      }

      // Check sTable matches
      for (let i = 0; i < serialized.sTable.length; i++) {
        expect(reSerialized.sTable[i]).toBeCloseTo(serialized.sTable[i], 10);
      }
    });

    it('should handle complex track shapes', () => {
      // Arrange - create a more complex track
      const complexTrackJSON: TrackJSON = {
        version: 1,
        width: 25,
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 150, y: 50 },
          { x: 100, y: 100 },
          { x: 50, y: 150 },
          { x: 0, y: 100 },
          { x: -50, y: 50 }
        ],
        smoothIterations: 2,
        sampleSpacing: 5
      };
      const originalTrack = Track.fromJSON(complexTrackJSON);

      // Act
      const serialized = originalTrack.toSerializedData();
      const deserializedTrack = Track.fromSerializedData(serialized);

      // Assert
      expect(deserializedTrack.width).toBe(originalTrack.width);
      expect(deserializedTrack.length).toBeCloseTo(originalTrack.length, 5);
    });
  });

  describe('Track Methods After Deserialization', () => {
    it('should maintain track functionality after deserialization', () => {
      // Arrange
      const originalTrack = createTestTrack();
      const serialized = originalTrack.toSerializedData();
      const deserializedTrack = Track.fromSerializedData(serialized);

      // Act & Assert - test core methods work
      const pos1 = deserializedTrack.posAt(0);
      const pos2 = deserializedTrack.posAt(deserializedTrack.length / 2);
      
      expect(pos1).toHaveProperty('x');
      expect(pos1).toHaveProperty('y');
      expect(pos2).toHaveProperty('x');
      expect(pos2).toHaveProperty('y');

      // Test tangent calculation
      const tangent = deserializedTrack.tangentAt(0);
      expect(tangent).toHaveProperty('x');
      expect(tangent).toHaveProperty('y');
      expect(Math.hypot(tangent.x, tangent.y)).toBeCloseTo(1, 5); // Should be normalized

      // Test normal calculation
      const normal = deserializedTrack.normalAt(0);
      expect(normal).toHaveProperty('x');
      expect(normal).toHaveProperty('y');
      expect(Math.hypot(normal.x, normal.y)).toBeCloseTo(1, 5); // Should be normalized

      // Test wrapping
      const wrappedS = deserializedTrack.wrapS(deserializedTrack.length + 10);
      expect(wrappedS).toBeCloseTo(10, 5);
    });

    it('should produce consistent results compared to original track', () => {
      // Arrange
      const originalTrack = createTestTrack();
      const serialized = originalTrack.toSerializedData();
      const deserializedTrack = Track.fromSerializedData(serialized);

      // Test positions at various points
      const testPositions = [0, 0.25, 0.5, 0.75, 1.0];
      
      testPositions.forEach(fraction => {
        const s = fraction * originalTrack.length;
        
        // Act
        const originalPos = originalTrack.posAt(s);
        const deserializedPos = deserializedTrack.posAt(s);
        
        const originalTangent = originalTrack.tangentAt(s);
        const deserializedTangent = deserializedTrack.tangentAt(s);

        // Assert
        expect(deserializedPos.x).toBeCloseTo(originalPos.x, 5);
        expect(deserializedPos.y).toBeCloseTo(originalPos.y, 5);
        expect(deserializedTangent.x).toBeCloseTo(originalTangent.x, 5);
        expect(deserializedTangent.y).toBeCloseTo(originalTangent.y, 5);
      });
    });
  });
});

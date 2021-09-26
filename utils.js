"use strict";

export const range = (size) => [...Array(size).keys()];

export const replaceAt = (array, index, newValue) =>
  Object.assign([], array, { [index]: newValue });

export const repeat = (value, times) => Array(times).fill(value);

export const getMemoizedElementById = (id) =>
  ((elementId) => {
    const element = document.getElementById(elementId);

    if (!element) {
      throw new Error(
        `Can not locate the element with ID "${elementId}" on the page`
      );
    }

    return () => element;
  })(id);

export const appendChildren = (element, children) =>
  children.forEach((child) => element.appendChild(child));

const until = (shouldEnd, nextStep, value) =>
  shouldEnd(value) ? value : until(shouldEnd, nextStep, nextStep(value));

function extractSequence(array, start, nextStep, end) {
  const startElement = array[start];

  const { sequence, indexes } = until(
    ({ lastIndex }) => lastIndex === end || lastIndex >= array.length,
    ({ sequence, indexes, lastIndex }) => {
      const index = nextStep(lastIndex);
      const element = array[index];

      return {
        sequence: [...sequence, element],
        indexes: [...indexes, index],
        lastIndex: index,
      };
    },
    { sequence: [startElement], indexes: [start], lastIndex: start }
  );

  return { sequence, indexes };
}

export const toFlatIndex = (dimension) => (index2D) =>
  index2D[0] * dimension + index2D[1];

export const fromFlatIndex = (dimension) => (index) => {
  const x = Math.floor(index / dimension);
  const y = index % dimension;
  return [x, y];
};

export function extractSequence2D(array2D, start, nextStep, end) {
  const dimension = array2D.length - 1;
  const convertIndex = toFlatIndex(dimension);
  const revertIndex = fromFlatIndex(dimension);

  const { sequence, indexes } = extractSequence(
    array2D.flat(),
    convertIndex(start),
    (lastIndex) => convertIndex(nextStep(revertIndex(lastIndex))),
    !!end ? convertIndex(end) : end
  );

  return { sequence, indexes: indexes.map(revertIndex) };
}

export function toSequenceString(sequence) {
  const withoutNull = (value) => (value == null ? " " : value);
  return sequence.map(withoutNull).join("");
}

export const sequenceContains = (sequence, searchSequence) =>
  toSequenceString(sequence).includes(toSequenceString(searchSequence));

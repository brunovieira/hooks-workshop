import React from 'react';
import { Image } from 'canvas';
import { fireEvent, render, act } from '@testing-library/react';
import { saveAs } from 'file-saver';

import MemeCreator from './MemeCreator';

async function getCanvasSnapshot(canvas) {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.5));
  const blobText = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => resolve(evt.target.result);
    reader.onerror = reject;
    reader.readAsText(blob);
  });

  return blobText;
}

jest.mock('./memeTemplates.json', () => [
  {
    value: 'cryingDawson',
    text: 'Crying Dawson',
    path: '/memes/dawson.jpg',
  },
  {
    value: 'jackieChan',
    text: 'Jackie Chan',
    path: '/memes/jackie-chan.jpg',
  },
]);

jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

const RealImage = window.Image;

beforeAll(() => {
  window.Image = Image;
});

afterAll(() => {
  window.Image = RealImage;
});

test('renders component correctly', async () => {
  let getByLabelText;

  await act(async () => {
    ({ getByLabelText } = render(<MemeCreator />));
  });

  const selectElement = getByLabelText(/meme template/i);
  expect(selectElement).toBeInTheDocument();
  const inputElement = getByLabelText(/meme caption/i);
  expect(inputElement).toBeInTheDocument();
});

test('sets up the canvas on load', async () => {
  let container;
  const drawSpy = jest.spyOn(MemeCreator.prototype, 'drawCanvas');

  await act(async () => {
    ({ container } = render(<MemeCreator />));
  });

  expect(drawSpy).toHaveBeenCalledTimes(1);
  expect(drawSpy).toHaveBeenCalledWith(expect.any(Image), '');

  const canvas = container.querySelector('canvas');
  expect(canvas.width).toBe(500); // match dawson.jpg width
  expect(canvas.height).toBe(451); // match dawson.jpg height
  const snapshot = await getCanvasSnapshot(canvas);
  expect(snapshot).toMatchSnapshot();

  drawSpy.mockRestore();
});

test('updates the canvas on caption change', async () => {
  let container;
  let getByLabelText;
  const drawSpy = jest.spyOn(MemeCreator.prototype, 'drawCanvas');

  await act(async () => {
    ({ container, getByLabelText } = render(<MemeCreator />));
  });

  expect(drawSpy).toHaveBeenCalledTimes(1);
  expect(drawSpy).toHaveBeenLastCalledWith(expect.any(Image), '');

  // update caption
  await act(async () => {
    const inputElement = getByLabelText(/meme caption/i);
    fireEvent.change(inputElement, { target: { value: 'Hello' } });
  });

  expect(drawSpy).toHaveBeenCalledTimes(2);
  expect(drawSpy).toHaveBeenLastCalledWith(expect.any(Image), 'Hello');

  const canvas = container.querySelector('canvas');
  expect(canvas.width).toBe(500); // match dawson.jpg width
  expect(canvas.height).toBe(451); // match dawson.jpg height
  const snapshot = await getCanvasSnapshot(canvas);
  expect(snapshot).toMatchSnapshot();

  drawSpy.mockRestore();
});

test('updates the canvas when another template is selected', async () => {
  let container;
  let getByLabelText;
  const drawSpy = jest.spyOn(MemeCreator.prototype, 'drawCanvas');

  await act(async () => {
    ({ container, getByLabelText } = render(<MemeCreator />));
  });

  expect(drawSpy).toHaveBeenCalledTimes(1);
  expect(drawSpy).toHaveBeenLastCalledWith(expect.any(Image), '');

  // update template
  await act(async () => {
    const selectElement = getByLabelText(/meme template/i);
    fireEvent.change(selectElement, { target: { value: 'jackieChan' } });
  });

  expect(drawSpy).toHaveBeenCalledTimes(2);
  expect(drawSpy).toHaveBeenLastCalledWith(expect.any(Image), '');

  const canvas = container.querySelector('canvas');
  expect(canvas.width).toBe(500); // match jackie-chan.jpg width
  expect(canvas.height).toBe(327); // match jackie-chan.jpg height
  const snapshot = await getCanvasSnapshot(canvas);
  expect(snapshot).toMatchSnapshot();

  drawSpy.mockRestore();
});

test('triggers a save of the canvas Blob when clicking Download btn', async () => {
  // set a Promise that resolves when our saveAs mock is called
  const saveCalled = new Promise((resolve) => {
    saveAs.mockClear();
    saveAs.mockImplementation(resolve);
  });

  let getByText;
  await act(async () => {
    ({ getByText } = render(<MemeCreator />));
  });

  // click Download btn
  await act(async () => {
    const dlBtn = getByText(/download/i);
    fireEvent.click(dlBtn);
  });

  await saveCalled;
  expect(saveAs).toHaveBeenCalledTimes(1);

  saveAs.mockImplementation(() => {}); // set mock back to a noop
});

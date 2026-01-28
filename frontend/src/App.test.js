import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import React from 'react';

// Mock the SakuraCanvas component to avoid canvas issues in jsdom
jest.mock('./components/SakuraCanvas', () => () => <div data-testid="sakura-canvas"></div>);

// Mock UserProvider to avoid real API calls during App render
jest.mock('./context/UserContext', () => ({
  UserProvider: ({ children }) => <div>{children}</div>,
  useUser: () => ({ user: null, loadingUser: false }),
}));

test('renders app and homepage content', async () => {
  render(<App />);

  // Check for the title "Haiji" which is on the HomePage
  const titleElement = await screen.findByText(/Haiji/i);
  expect(titleElement).toBeInTheDocument();

  // Check that navigation bar is likely present (e.g. login link)
  // Depending on what Navbar renders for guest
});

import { fireEvent, render, screen } from '@testing-library/react-native';

import { Accent } from '@/constants/theme';

import { Button } from '../button';

describe('Button', () => {
  it('renders its label and fires onPress', async () => {
    const onPress = jest.fn();
    await render(<Button testID="go" label="Go" onPress={onPress} />);

    expect(screen.getByText('Go')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('blocks presses when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button testID="go" label="Go" onPress={onPress} disabled />);

    await fireEvent.press(screen.getByTestId('go'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('maps variants to the theme accent colors', async () => {
    await render(
      <>
        <Button testID="p" label="Primary" onPress={jest.fn()} />
        <Button testID="d" label="Danger" onPress={jest.fn()} variant="danger" />
      </>,
    );

    expect(screen.getByTestId('p')).toHaveStyle({ backgroundColor: Accent.primary });
    expect(screen.getByTestId('d')).toHaveStyle({ backgroundColor: Accent.danger });
  });
});

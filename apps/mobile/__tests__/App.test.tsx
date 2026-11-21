import { render } from "@testing-library/react-native";
import App from "../App";

test("renders the localized app name", () => {
  const { getByText } = render(<App />);

  expect(getByText("गाँवमंडी")).toBeTruthy();
});

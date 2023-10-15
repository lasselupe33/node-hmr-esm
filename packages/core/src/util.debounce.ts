export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number
) {
  let timer: NodeJS.Timeout;

  // Return an anonymous function that takes in any number of arguments
  return function (...args: TArgs) {
    // Clear the previous timer to prevent the execution of 'mainFunction'
    clearTimeout(timer);

    // Set a new timer that will execute 'mainFunction' after the specified
    // delay
    timer = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}

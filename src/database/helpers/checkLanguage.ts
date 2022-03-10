import { UserInputError } from 'apollo-server';
import config from '../../config';

/**
 * Checks if the language code passed in is in the list of allowed languages.
 *
 * @param language
 */
export const checkLanguage = (language: string): void => {
  if (!config.app.languages.includes(language)) {
    throw new UserInputError(
      `Please use an allowed language code. These include ${config.app.languages.join(
        ', '
      )}.`
    );
  }
};

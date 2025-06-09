import { Page } from 'playwright';
/**
 * Tenta clicar em um elemento usando várias estratégias
 */
export declare function clickWithRetry(page: Page, selector: string): Promise<boolean>;
/**
 * Seleciona um item de dropdown pelo texto visível
 */
export declare function selectDropdownItemByText(page: Page, dropdownSelector: string, itemText: string): Promise<boolean>;
/**
 * Verifica se há um modal aberto e fecha se necessário
 */
export declare function closeModalIfExists(page: Page): Promise<boolean>;

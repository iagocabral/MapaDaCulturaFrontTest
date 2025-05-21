import { Page } from 'playwright';

/**
 * Tenta clicar em um elemento usando diferentes estratégias quando o método padrão falha
 */
export async function clickRobust(page: Page, selector: string, options = { timeout: 10000, force: false }) {
  try {
    // Tenta o método padrão primeiro
    await page.click(selector, { timeout: options.timeout, force: options.force });
    return true;
  } catch (e) {
    console.log(`⚠️ Clique padrão falhou em ${selector}: ${e.message}`);
    
    try {
      // Tenta usar JavaScript para clicar
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) {
          (element as HTMLElement).click();
          return true;
        }
        return false;
      }, selector);
      console.log(`✅ Clique via JavaScript em ${selector}`);
      return true;
    } catch (e) {
      console.log(`⚠️ Clique via JavaScript falhou em ${selector}: ${e.message}`);
      
      try {
        // Tenta clique posicional
        const element = await page.$(selector);
        if (element) {
          const box = await element.boundingBox();
          if (box) {
            await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
            console.log(`✅ Clique posicional em ${selector}`);
            return true;
          }
        }
        return false;
      } catch (e) {
        console.log(`⚠️ Todas as tentativas de clique falharam em ${selector}`);
        return false;
      }
    }
  }
}

/**
 * Tenta selecionar um item de uma lista de dropdown
 */
export async function selectDropdownItem(page: Page, triggerSelector: string, itemSelector: string, itemIndex = 0) {
  // Clica no trigger do dropdown
  await clickRobust(page, triggerSelector);
  await page.waitForTimeout(1000);
    
  try {
    // Tenta localizar e clicar em um item específico
    const items = await page.$$(itemSelector);
    if (items.length > itemIndex) {
      await items[itemIndex].click();
      console.log(`✅ Item #${itemIndex} selecionado do dropdown`);
      return true;
    } else {
      console.log(`⚠️ Não encontrou itens suficientes no dropdown. Total: ${items.length}`);
      
      // Tenta usar Tab + Enter como fallback
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      console.log("✅ Tentativa de selecionar via Tab+Enter");
      
      return true;
    }
  } catch (e) {
    console.log(`⚠️ Erro ao selecionar item do dropdown: ${e.message}`);
    return false;
  }
}

/**
 * Verifica se um modal está aberto e tenta fechá-lo
 */
export async function closeModalIfExists(page: Page) {
  try {
    const hasModal = await page.evaluate(() => {
      const modals = document.querySelectorAll('.modal, [role="dialog"], .vfm__container');
      return modals.length > 0;
    });
    
    if (hasModal) {
      await page.evaluate(() => {
        const closeButtons = document.querySelectorAll('.close-button, .btn-close, [aria-label="Close"], .vfm__close');
        if (closeButtons.length > 0) (closeButtons[0] as HTMLElement).click();
      });
      console.log("✅ Modal fechado automaticamente");
      return true;
    }
    return false;
  } catch (e) {
    console.log(`⚠️ Erro ao verificar/fechar modal: ${e.message}`);
    return false;
  }
}

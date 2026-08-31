import { extensions } from '@wix/astro/builders'

export default extensions.embeddedScript({
  id: '97745c0f-9118-4f67-8a30-7193764f470c',
  name: 'Saved Properties Launcher',
  placement: 'BODY_END',
  scriptType: 'ESSENTIAL',
  source: './extensions/site/embedded-scripts/saved-properties/saved-properties.html',
});

import { extensions } from '@wix/astro/builders'

export default extensions.customElement({
  id: '0da45731-397a-428d-808a-43e5d567f8c1',
  name: 'Property Detail Widget',
  width: {
    defaultWidth: 450,
    allowStretch: true
  },
  height: {
    defaultHeight: 250
  },
  installation: {
    autoAdd: true
  },
  presets: [
    {
      id: 'cddd12e8-a67d-420c-b090-010730e230a4',
      name: 'default',
      thumbnailUrl: '{{BASE_URL}}/property-detail-widget-thumbnail.png',
    },
  ],
  
  tagName: 'property-detail-widget',
  element: './extensions/site/widgets/property-detail-widget/property-detail-widget.tsx',
  settings: './extensions/site/widgets/property-detail-widget/property-detail-widget.panel.tsx',
});

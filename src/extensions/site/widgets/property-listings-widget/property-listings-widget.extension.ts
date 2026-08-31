import { extensions } from '@wix/astro/builders'

export default extensions.customElement({
  id: '05218155-4c5a-4549-b29d-92751f298cba',
  name: 'Property Listings Widget',
  width: {
    defaultWidth: 450,
    allowStretch: true
  },
  height: {
    defaultHeight: 250
  },
  installation: {
    autoAdd: false
  },
  presets: [
    {
      id: '894b9f3d-e6be-4d4a-94e1-26178f39d9f8',
      name: 'default',
      thumbnailUrl: '{{BASE_URL}}/property-listings-widget-thumbnail.png',
    },
  ],
  
  tagName: 'property-listings-widget',
  element: './extensions/site/widgets/property-listings-widget/property-listings-widget.tsx',
  settings: './extensions/site/widgets/property-listings-widget/property-listings-widget.panel.tsx',
});

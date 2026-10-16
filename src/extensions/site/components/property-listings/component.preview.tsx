// This file is the Editor preview entry point for your component.
// Override or extend it when you need Editor-specific behavior or rendering
// (e.g. mock data, Editor-only interactions, or a different visual state).

import React from 'react';
import type { ComponentProps, FC } from 'react';
import {
  useIsEditMode,
  withDefaults,
  withFallbackPlaceholder,
} from '@wix/react-component-utils';
import { DesignModeContext } from '../property-parts/runtime';
import Component from './property-listings';
import { defaultProps } from './property-listings.props';

const PropertyListingsPreview: FC<ComponentProps<typeof Component>> = (props) => {
  const isEditMode = useIsEditMode();
  return <DesignModeContext.Provider value={isEditMode}><Component {...props} /></DesignModeContext.Provider>;
};

const PropertyListingsPreviewWithFallback = withFallbackPlaceholder(PropertyListingsPreview, {
  requiredDataFields: ['title'],
  rootClassName: 'property-listings',
});

export default withDefaults(
  PropertyListingsPreviewWithFallback,
  defaultProps
);

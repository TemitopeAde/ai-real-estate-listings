/**
 * THIS FILE IS AUTO-GENERATED — DO NOT EDIT.
 * It contains the `editorElement` portion of the manifest, automatically derived from your component's
 * source code, prop types, and CSS rules.
 * Update your source code and run `npx wix build && npx wix generate manifest` to regenerate it.
 * If you need to override specific manifest values (sizing, layout, etc.),
 * you can do so in property-listings.extension.ts.
 */

import type { EditorElement } from '@wix/react-component-schema';

export const editorElement = {
  "selector": ".property-listings",
  "displayName": "Property Listings",
  "data": {
    "direction": {
      "displayName": "Direction",
      "dataType": "direction"
    },
    "a11y": {
      "displayName": "Accessibility",
      "dataType": "a11y",
      "a11y": {
        "attributes": [
          "ariaLabel"
        ]
      }
    },
    "title": {
      "displayName": "Title",
      "dataType": "text",
      "text": {}
    },
    "subtitle": {
      "displayName": "Subtitle",
      "dataType": "text",
      "text": {}
    },
    "language": {
      "displayName": "Language",
      "dataType": "textEnum",
      "textEnum": {
        "options": [
          {
            "value": "auto",
            "displayName": "Auto"
          },
          {
            "value": "en",
            "displayName": "En"
          },
          {
            "value": "zh",
            "displayName": "Zh"
          },
          {
            "value": "hi",
            "displayName": "Hi"
          },
          {
            "value": "es",
            "displayName": "Es"
          },
          {
            "value": "fr",
            "displayName": "Fr"
          },
          {
            "value": "ar",
            "displayName": "Ar"
          },
          {
            "value": "pt",
            "displayName": "Pt"
          },
          {
            "value": "ru",
            "displayName": "Ru"
          },
          {
            "value": "ja",
            "displayName": "Ja"
          },
          {
            "value": "de",
            "displayName": "De"
          }
        ]
      }
    },
    "enableComparison": {
      "displayName": "Enable Comparison",
      "dataType": "booleanValue"
    },
    "loadingMode": {
      "displayName": "Loading Mode",
      "dataType": "textEnum",
      "textEnum": {
        "options": [
          {
            "value": "load-more",
            "displayName": "Load More"
          },
          {
            "value": "infinite",
            "displayName": "Infinite"
          },
          {
            "value": "pagination",
            "displayName": "Pagination"
          }
        ]
      }
    },
    "pageSize": {
      "displayName": "Page Size",
      "dataType": "number",
      "number": {
        "min": "1",
        "max": "100"
      }
    },
    "loadMoreLabel": {
      "displayName": "Load More Label",
      "dataType": "text",
      "text": {}
    },
    "previousLabel": {
      "displayName": "Previous Label",
      "dataType": "text",
      "text": {}
    },
    "nextLabel": {
      "displayName": "Next Label",
      "dataType": "text",
      "text": {}
    },
    "detailPage": {
      "displayName": "Detail Page",
      "dataType": "link",
      "link": {
        "linkTypes": [
          "externalLink",
          "anchorLink",
          "emailLink",
          "phoneLink",
          "dynamicPageLink",
          "pageLink",
          "whatsAppLink",
          "documentLink",
          "popupLink",
          "addressLink",
          "edgeAnchorLinks",
          "loginToWixLink"
        ]
      }
    },
    "enableSearch": {
      "displayName": "Enable Search",
      "dataType": "booleanValue"
    },
    "enableTransactionFilter": {
      "displayName": "Enable Transaction Filter",
      "dataType": "booleanValue"
    },
    "enablePropertyTypeFilter": {
      "displayName": "Enable Property Type Filter",
      "dataType": "booleanValue"
    },
    "enablePriceFilter": {
      "displayName": "Enable Price Filter",
      "dataType": "booleanValue"
    },
    "enableBedroomsFilter": {
      "displayName": "Enable Bedrooms Filter",
      "dataType": "booleanValue"
    }
  },
  "elements": {
    "propertyListingsHeading": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".property-listings-heading",
        "displayName": "Heading",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "font": {
            "defaultValue": "700 28px\"Helvetica Neue\",Helvetica,Arial,sans-serif"
          },
          "lineHeight": {
            "defaultValue": "1.2"
          },
          "letterSpacing": {
            "defaultValue": "-.03em"
          },
          "textDecorationLine": {},
          "textTransform": {},
          "textAlign": {},
          "textShadow": {},
          "color": {},
          "marginTop": {
            "defaultValue": "0"
          },
          "marginBottom": {
            "defaultValue": "0"
          },
          "marginInlineStart": {
            "defaultValue": "0"
          },
          "marginInlineEnd": {
            "defaultValue": "0"
          },
          "display": {
            "display": {
              "displayValues": [
                "none",
                "block"
              ]
            }
          },
          "alignSelf": {}
        }
      }
    },
    "propertyListingsSubtitle": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".property-listings-subtitle",
        "displayName": "Subtitle",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "font": {},
          "lineHeight": {},
          "letterSpacing": {},
          "textDecorationLine": {},
          "textTransform": {},
          "textAlign": {},
          "textShadow": {},
          "color": {
            "defaultValue": "#68736c"
          },
          "marginTop": {
            "defaultValue": "6px"
          },
          "marginBottom": {
            "defaultValue": "0"
          },
          "marginInlineStart": {
            "defaultValue": "0"
          },
          "marginInlineEnd": {
            "defaultValue": "0"
          },
          "display": {
            "display": {
              "displayValues": [
                "none",
                "block"
              ]
            }
          },
          "alignSelf": {}
        }
      }
    },
    "propertyListingsFilters": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".property-listings-filters",
        "displayName": "Filters",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "background": {
            "defaultValue": "transparent"
          },
          "borderTop": {
            "defaultValue": "0"
          },
          "borderBottom": {
            "defaultValue": "0"
          },
          "borderInlineStart": {
            "defaultValue": "0"
          },
          "borderInlineEnd": {
            "defaultValue": "0"
          },
          "paddingTop": {
            "defaultValue": "0"
          },
          "paddingBottom": {
            "defaultValue": "0"
          },
          "paddingInlineStart": {
            "defaultValue": "0"
          },
          "paddingInlineEnd": {
            "defaultValue": "0"
          },
          "borderStartStartRadius": {},
          "borderStartEndRadius": {},
          "borderEndStartRadius": {},
          "borderEndEndRadius": {},
          "boxShadow": {},
          "width": {},
          "height": {},
          "overflow": {
            "defaultValue": "visible"
          },
          "mixBlendMode": {},
          "display": {
            "display": {
              "displayValues": [
                "none",
                "flex"
              ]
            }
          },
          "marginTop": {
            "defaultValue": "0"
          },
          "marginBottom": {
            "defaultValue": "0"
          },
          "marginInlineStart": {
            "defaultValue": "0"
          },
          "marginInlineEnd": {
            "defaultValue": "0"
          },
          "gap": {
            "defaultValue": "10px"
          },
          "flexDirection": {},
          "justifyContent": {},
          "alignItems": {
            "defaultValue": "center"
          },
          "alignSelf": {}
        },
        "elements": {
          "propertyListingsSearch": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".property-listings-search",
              "displayName": "Search",
              "behaviors": {
                "removable": true,
                "selectable": false
              },
              "cssProperties": {
                "font": {
                  "defaultValue": "inherit"
                },
                "lineHeight": {},
                "letterSpacing": {},
                "textDecorationLine": {},
                "textTransform": {},
                "textAlign": {},
                "textShadow": {},
                "color": {
                  "defaultValue": "#17211b"
                },
                "background": {
                  "defaultValue": "transparent"
                },
                "borderTop": {
                  "defaultValue": "1px solid #aeb6b0"
                },
                "borderBottom": {
                  "defaultValue": "1px solid #aeb6b0"
                },
                "borderInlineStart": {
                  "defaultValue": "1px solid #aeb6b0"
                },
                "borderInlineEnd": {
                  "defaultValue": "1px solid #aeb6b0"
                },
                "paddingTop": {
                  "defaultValue": "9px"
                },
                "paddingBottom": {
                  "defaultValue": "9px"
                },
                "paddingInlineStart": {
                  "defaultValue": "11px"
                },
                "paddingInlineEnd": {
                  "defaultValue": "11px"
                },
                "borderStartStartRadius": {
                  "defaultValue": "8px"
                },
                "borderStartEndRadius": {
                  "defaultValue": "8px"
                },
                "borderEndStartRadius": {
                  "defaultValue": "8px"
                },
                "borderEndEndRadius": {
                  "defaultValue": "8px"
                },
                "boxShadow": {},
                "width": {
                  "defaultValue": "100%"
                },
                "height": {},
                "overflow": {},
                "mixBlendMode": {},
                "marginTop": {},
                "marginBottom": {},
                "marginInlineStart": {},
                "marginInlineEnd": {},
                "display": {
                  "display": {
                    "displayValues": [
                      "none",
                      "inlineBlock"
                    ]
                  }
                },
                "alignSelf": {}
              },
              "states": {
                "invalid": {
                  "displayName": "Invalid",
                  "className": "property-listings-search--invalid",
                  "pseudoClass": "invalid"
                },
                "hover": {
                  "displayName": "Hover",
                  "className": "property-listings-search--hover",
                  "pseudoClass": "hover"
                },
                "focus": {
                  "displayName": "Focus",
                  "className": "property-listings-search--focus",
                  "pseudoClass": "focus"
                },
                "disabled": {
                  "displayName": "Disabled",
                  "className": "property-listings-search--disabled",
                  "pseudoClass": "disabled"
                }
              }
            }
          },
          "propertyListingsSelect": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".property-listings-select",
              "displayName": "Select",
              "behaviors": {
                "removable": true,
                "selectable": false
              },
              "cssProperties": {
                "font": {
                  "defaultValue": "inherit"
                },
                "lineHeight": {},
                "letterSpacing": {},
                "textDecorationLine": {},
                "textTransform": {},
                "textAlign": {},
                "textShadow": {},
                "color": {
                  "defaultValue": "#17211b"
                },
                "background": {
                  "defaultValue": "transparent"
                },
                "borderTop": {
                  "defaultValue": "1px solid #aeb6b0"
                },
                "borderBottom": {
                  "defaultValue": "1px solid #aeb6b0"
                },
                "borderInlineStart": {
                  "defaultValue": "1px solid #aeb6b0"
                },
                "borderInlineEnd": {
                  "defaultValue": "1px solid #aeb6b0"
                },
                "paddingTop": {
                  "defaultValue": "9px"
                },
                "paddingBottom": {
                  "defaultValue": "9px"
                },
                "paddingInlineStart": {
                  "defaultValue": "11px"
                },
                "paddingInlineEnd": {
                  "defaultValue": "11px"
                },
                "borderStartStartRadius": {
                  "defaultValue": "8px"
                },
                "borderStartEndRadius": {
                  "defaultValue": "8px"
                },
                "borderEndStartRadius": {
                  "defaultValue": "8px"
                },
                "borderEndEndRadius": {
                  "defaultValue": "8px"
                },
                "boxShadow": {},
                "width": {
                  "defaultValue": "100%"
                },
                "height": {},
                "overflow": {},
                "mixBlendMode": {},
                "marginTop": {},
                "marginBottom": {},
                "marginInlineStart": {},
                "marginInlineEnd": {},
                "display": {
                  "display": {
                    "displayValues": [
                      "none",
                      "inlineBlock"
                    ]
                  }
                },
                "alignSelf": {}
              },
              "states": {
                "invalid": {
                  "displayName": "Invalid",
                  "className": "property-listings-select--invalid",
                  "pseudoClass": "invalid"
                },
                "hover": {
                  "displayName": "Hover",
                  "className": "property-listings-select--hover",
                  "pseudoClass": "hover"
                },
                "focus": {
                  "displayName": "Focus",
                  "className": "property-listings-select--focus",
                  "pseudoClass": "focus"
                },
                "disabled": {
                  "displayName": "Disabled",
                  "className": "property-listings-select--disabled",
                  "pseudoClass": "disabled"
                }
              }
            }
          },
          "propertyListingsPrice": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".property-listings-price",
              "displayName": "Price",
              "behaviors": {
                "removable": true,
                "selectable": false
              },
              "cssProperties": {
                "background": {},
                "borderTop": {},
                "borderBottom": {},
                "borderInlineStart": {},
                "borderInlineEnd": {},
                "paddingTop": {},
                "paddingBottom": {},
                "paddingInlineStart": {},
                "paddingInlineEnd": {},
                "borderStartStartRadius": {},
                "borderStartEndRadius": {},
                "borderEndStartRadius": {},
                "borderEndEndRadius": {},
                "boxShadow": {},
                "width": {
                  "defaultValue": "100%"
                },
                "height": {},
                "overflow": {},
                "mixBlendMode": {},
                "marginTop": {
                  "defaultValue": "0"
                },
                "marginBottom": {
                  "defaultValue": "0"
                },
                "marginInlineStart": {
                  "defaultValue": "0"
                },
                "marginInlineEnd": {
                  "defaultValue": "0"
                },
                "display": {
                  "display": {
                    "displayValues": [
                      "none",
                      "inlineBlock"
                    ]
                  }
                },
                "alignSelf": {}
              },
              "states": {
                "invalid": {
                  "displayName": "Invalid",
                  "className": "property-listings-price--invalid",
                  "pseudoClass": "invalid"
                },
                "hover": {
                  "displayName": "Hover",
                  "className": "property-listings-price--hover",
                  "pseudoClass": "hover"
                },
                "focus": {
                  "displayName": "Focus",
                  "className": "property-listings-price--focus",
                  "pseudoClass": "focus"
                },
                "disabled": {
                  "displayName": "Disabled",
                  "className": "property-listings-price--disabled",
                  "pseudoClass": "disabled"
                }
              }
            }
          },
          "propertyListingsReset": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".property-listings-reset",
              "displayName": "Reset",
              "behaviors": {
                "removable": true,
                "selectable": false
              },
              "cssProperties": {
                "color": {
                  "defaultValue": "#0c3b2e"
                },
                "background": {
                  "defaultValue": "transparent",
                  "statesDefaultValues": {
                    "hover": "#edf2ef"
                  }
                },
                "borderTop": {
                  "defaultValue": "0"
                },
                "borderBottom": {
                  "defaultValue": "0"
                },
                "borderInlineStart": {
                  "defaultValue": "0"
                },
                "borderInlineEnd": {
                  "defaultValue": "0"
                },
                "paddingTop": {
                  "defaultValue": "9px"
                },
                "paddingBottom": {
                  "defaultValue": "9px"
                },
                "paddingInlineStart": {
                  "defaultValue": "12px"
                },
                "paddingInlineEnd": {
                  "defaultValue": "12px"
                },
                "borderStartStartRadius": {},
                "borderStartEndRadius": {},
                "borderEndStartRadius": {},
                "borderEndEndRadius": {},
                "boxShadow": {},
                "width": {},
                "height": {},
                "overflow": {},
                "mixBlendMode": {},
                "marginTop": {},
                "marginBottom": {},
                "marginInlineStart": {},
                "marginInlineEnd": {},
                "display": {
                  "display": {
                    "displayValues": [
                      "none",
                      "inlineBlock"
                    ]
                  }
                },
                "font": {
                  "defaultValue": "inherit"
                },
                "lineHeight": {},
                "letterSpacing": {},
                "textDecorationLine": {},
                "textTransform": {},
                "textAlign": {},
                "textShadow": {},
                "alignSelf": {}
              },
              "states": {
                "hover": {
                  "displayName": "Hover",
                  "className": "property-listings-reset--hover",
                  "pseudoClass": "hover"
                },
                "disabled": {
                  "displayName": "Disabled",
                  "className": "property-listings-reset--disabled",
                  "pseudoClass": "disabled"
                }
              }
            }
          }
        }
      }
    },
    "propertyListingsMessage": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".property-listings-message",
        "displayName": "Message",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "font": {},
          "lineHeight": {},
          "letterSpacing": {},
          "textDecorationLine": {},
          "textTransform": {},
          "textAlign": {
            "defaultValue": "center"
          },
          "textShadow": {},
          "color": {
            "defaultValue": "#68736c"
          },
          "display": {
            "display": {
              "displayValues": [
                "none",
                "grid"
              ]
            }
          },
          "marginTop": {
            "defaultValue": "16px"
          },
          "marginBottom": {
            "defaultValue": "16px"
          },
          "marginInlineStart": {
            "defaultValue": "0"
          },
          "marginInlineEnd": {
            "defaultValue": "0"
          },
          "background": {},
          "borderTop": {},
          "borderBottom": {},
          "borderInlineStart": {},
          "borderInlineEnd": {},
          "paddingTop": {},
          "paddingBottom": {},
          "paddingInlineStart": {},
          "paddingInlineEnd": {},
          "borderStartStartRadius": {},
          "borderStartEndRadius": {},
          "borderEndStartRadius": {},
          "borderEndEndRadius": {},
          "boxShadow": {},
          "width": {},
          "height": {},
          "overflow": {},
          "mixBlendMode": {},
          "flexDirection": {},
          "justifyContent": {},
          "alignItems": {},
          "alignSelf": {}
        }
      }
    },
    "propertyListingsList": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".property-listings-list",
        "displayName": "List",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "background": {},
          "borderTop": {},
          "borderBottom": {},
          "borderInlineStart": {},
          "borderInlineEnd": {},
          "paddingTop": {},
          "paddingBottom": {},
          "paddingInlineStart": {},
          "paddingInlineEnd": {},
          "borderStartStartRadius": {},
          "borderStartEndRadius": {},
          "borderEndStartRadius": {},
          "borderEndEndRadius": {},
          "boxShadow": {},
          "width": {},
          "height": {},
          "overflow": {},
          "mixBlendMode": {},
          "display": {
            "display": {
              "displayValues": [
                "none",
                "grid"
              ]
            }
          },
          "marginTop": {
            "defaultValue": "1.5rem"
          },
          "marginBottom": {},
          "marginInlineStart": {},
          "marginInlineEnd": {},
          "gap": {
            "defaultValue": "24px"
          },
          "flexDirection": {},
          "justifyContent": {},
          "alignItems": {},
          "alignSelf": {}
        },
        "elements": {
          "propertyListingsCard": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".property-listings-card",
              "displayName": "Card",
              "behaviors": {
                "removable": true,
                "selectable": false
              },
              "cssProperties": {
                "background": {
                  "defaultValue": "#fff"
                },
                "borderTop": {
                  "defaultValue": "0 solid #dfe5e0"
                },
                "borderBottom": {
                  "defaultValue": "0 solid #dfe5e0"
                },
                "borderInlineStart": {
                  "defaultValue": "0 solid #dfe5e0"
                },
                "borderInlineEnd": {
                  "defaultValue": "0 solid #dfe5e0"
                },
                "paddingTop": {},
                "paddingBottom": {},
                "paddingInlineStart": {},
                "paddingInlineEnd": {},
                "borderStartStartRadius": {
                  "defaultValue": "18px"
                },
                "borderStartEndRadius": {
                  "defaultValue": "18px"
                },
                "borderEndStartRadius": {
                  "defaultValue": "18px"
                },
                "borderEndEndRadius": {
                  "defaultValue": "18px"
                },
                "boxShadow": {
                  "defaultValue": "0 12px 30px #17211b14"
                },
                "width": {},
                "height": {},
                "overflow": {
                  "defaultValue": "hidden"
                },
                "mixBlendMode": {},
                "marginTop": {},
                "marginBottom": {},
                "marginInlineStart": {},
                "marginInlineEnd": {},
                "display": {
                  "display": {
                    "displayValues": [
                      "none",
                      "block"
                    ]
                  }
                },
                "alignSelf": {}
              },
              "states": {
                "hover": {
                  "displayName": "Hover",
                  "className": "property-listings-card--hover",
                  "pseudoClass": "hover"
                }
              },
              "elements": {
                "propertyGallery": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-gallery",
                    "displayName": "Property Gallery",
                    "behaviors": {
                      "removable": true,
                      "selectable": false
                    },
                    "cssProperties": {
                      "background": {
                        "defaultValue": "transparent"
                      },
                      "borderTop": {},
                      "borderBottom": {},
                      "borderInlineStart": {},
                      "borderInlineEnd": {},
                      "paddingTop": {
                        "defaultValue": "20px"
                      },
                      "paddingBottom": {
                        "defaultValue": "20px"
                      },
                      "paddingInlineStart": {
                        "defaultValue": "20px"
                      },
                      "paddingInlineEnd": {
                        "defaultValue": "20px"
                      },
                      "borderStartStartRadius": {},
                      "borderStartEndRadius": {},
                      "borderEndStartRadius": {},
                      "borderEndEndRadius": {},
                      "boxShadow": {},
                      "width": {
                        "defaultValue": "100%"
                      },
                      "height": {},
                      "overflow": {
                        "defaultValue": "hidden"
                      },
                      "mixBlendMode": {},
                      "display": {
                        "display": {
                          "displayValues": [
                            "none",
                            "block"
                          ]
                        }
                      },
                      "marginTop": {
                        "defaultValue": "var(--listing-margin)"
                      },
                      "marginBottom": {
                        "defaultValue": "var(--listing-margin)"
                      },
                      "marginInlineStart": {
                        "defaultValue": "var(--listing-margin)"
                      },
                      "marginInlineEnd": {
                        "defaultValue": "var(--listing-margin)"
                      },
                      "gap": {},
                      "flexDirection": {
                        "defaultValue": "column"
                      },
                      "justifyContent": {},
                      "alignItems": {}
                    },
                    "elements": {
                      "propertyGalleryImage": {
                        "elementType": "inlineElement",
                        "inlineElement": {
                          "selector": ".property-gallery-image",
                          "displayName": "Image",
                          "behaviors": {
                            "removable": true,
                            "selectable": false
                          },
                          "cssProperties": {
                            "borderTop": {},
                            "borderBottom": {},
                            "borderInlineStart": {},
                            "borderInlineEnd": {},
                            "borderStartStartRadius": {},
                            "borderStartEndRadius": {},
                            "borderEndStartRadius": {},
                            "borderEndEndRadius": {},
                            "boxShadow": {},
                            "width": {
                              "defaultValue": "100%"
                            },
                            "height": {
                              "defaultValue": "100%"
                            },
                            "overflow": {},
                            "objectFit": {
                              "defaultValue": "cover"
                            },
                            "objectPosition": {},
                            "mixBlendMode": {},
                            "display": {
                              "display": {
                                "displayValues": [
                                  "none",
                                  "block"
                                ]
                              }
                            },
                            "marginTop": {},
                            "marginBottom": {},
                            "marginInlineStart": {},
                            "marginInlineEnd": {},
                            "alignSelf": {}
                          }
                        }
                      },
                      "propertyGalleryControl": {
                        "elementType": "inlineElement",
                        "inlineElement": {
                          "selector": ".property-gallery-control",
                          "displayName": "Control",
                          "behaviors": {
                            "removable": true,
                            "selectable": false
                          },
                          "cssProperties": {
                            "color": {
                              "defaultValue": "#17211b"
                            },
                            "background": {
                              "defaultValue": "#ffffffe6",
                              "statesDefaultValues": {
                                "hover": "#fff"
                              }
                            },
                            "borderTop": {
                              "defaultValue": "0"
                            },
                            "borderBottom": {
                              "defaultValue": "0"
                            },
                            "borderInlineStart": {
                              "defaultValue": "0"
                            },
                            "borderInlineEnd": {
                              "defaultValue": "0"
                            },
                            "paddingTop": {},
                            "paddingBottom": {},
                            "paddingInlineStart": {},
                            "paddingInlineEnd": {},
                            "borderStartStartRadius": {
                              "defaultValue": "50%"
                            },
                            "borderStartEndRadius": {
                              "defaultValue": "50%"
                            },
                            "borderEndStartRadius": {
                              "defaultValue": "50%"
                            },
                            "borderEndEndRadius": {
                              "defaultValue": "50%"
                            },
                            "boxShadow": {},
                            "width": {
                              "defaultValue": "32px"
                            },
                            "height": {
                              "defaultValue": "32px"
                            },
                            "overflow": {},
                            "mixBlendMode": {},
                            "display": {
                              "display": {
                                "displayValues": [
                                  "none",
                                  "grid"
                                ]
                              }
                            },
                            "font": {},
                            "lineHeight": {},
                            "letterSpacing": {},
                            "textDecorationLine": {},
                            "textTransform": {},
                            "textAlign": {},
                            "textShadow": {},
                            "marginTop": {},
                            "marginBottom": {},
                            "marginInlineStart": {},
                            "marginInlineEnd": {},
                            "flexDirection": {},
                            "justifyContent": {},
                            "alignItems": {},
                            "alignSelf": {}
                          },
                          "states": {
                            "hover": {
                              "displayName": "Hover",
                              "className": "property-gallery-control--hover",
                              "pseudoClass": "hover"
                            },
                            "disabled": {
                              "displayName": "Disabled",
                              "className": "property-gallery-control--disabled",
                              "pseudoClass": "disabled"
                            }
                          },
                          "elements": {
                            "lucide": {
                              "elementType": "inlineElement",
                              "inlineElement": {
                                "selector": ".lucide",
                                "displayName": "Lucide",
                                "behaviors": {
                                  "removable": true,
                                  "selectable": false
                                },
                                "cssProperties": {
                                  "background": {},
                                  "borderTop": {},
                                  "borderBottom": {},
                                  "borderInlineStart": {},
                                  "borderInlineEnd": {},
                                  "paddingTop": {},
                                  "paddingBottom": {},
                                  "paddingInlineStart": {},
                                  "paddingInlineEnd": {},
                                  "borderStartStartRadius": {},
                                  "borderStartEndRadius": {},
                                  "borderEndStartRadius": {},
                                  "borderEndEndRadius": {},
                                  "boxShadow": {},
                                  "width": {},
                                  "height": {},
                                  "overflow": {},
                                  "mixBlendMode": {},
                                  "marginTop": {},
                                  "marginBottom": {},
                                  "marginInlineStart": {},
                                  "marginInlineEnd": {},
                                  "display": {
                                    "display": {
                                      "displayValues": [
                                        "none",
                                        "block"
                                      ]
                                    }
                                  },
                                  "alignSelf": {}
                                }
                              }
                            }
                          }
                        }
                      },
                      "propertyGalleryDots": {
                        "elementType": "inlineElement",
                        "inlineElement": {
                          "selector": ".property-gallery-dots",
                          "displayName": "Dots",
                          "behaviors": {
                            "removable": true,
                            "selectable": false
                          },
                          "cssProperties": {
                            "background": {},
                            "borderTop": {},
                            "borderBottom": {},
                            "borderInlineStart": {},
                            "borderInlineEnd": {},
                            "paddingTop": {},
                            "paddingBottom": {},
                            "paddingInlineStart": {},
                            "paddingInlineEnd": {},
                            "borderStartStartRadius": {},
                            "borderStartEndRadius": {},
                            "borderEndStartRadius": {},
                            "borderEndEndRadius": {},
                            "boxShadow": {},
                            "width": {},
                            "height": {},
                            "overflow": {},
                            "mixBlendMode": {},
                            "display": {
                              "display": {
                                "displayValues": [
                                  "none",
                                  "flex"
                                ]
                              }
                            },
                            "marginTop": {},
                            "marginBottom": {},
                            "marginInlineStart": {},
                            "marginInlineEnd": {},
                            "flexDirection": {},
                            "justifyContent": {
                              "defaultValue": "center"
                            },
                            "alignItems": {},
                            "alignSelf": {}
                          }
                        }
                      }
                    }
                  }
                },
                "propertyListingsSave": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-listings-save",
                    "displayName": "Save",
                    "behaviors": {
                      "removable": true,
                      "selectable": false
                    },
                    "cssProperties": {
                      "color": {
                        "defaultValue": "#0c3b2e"
                      },
                      "background": {
                        "defaultValue": "#fffffff0",
                        "statesDefaultValues": {
                          "saved": "#dcece2",
                          "hover": "#e9f3ec"
                        }
                      },
                      "borderTop": {
                        "defaultValue": "0"
                      },
                      "borderBottom": {
                        "defaultValue": "0"
                      },
                      "borderInlineStart": {
                        "defaultValue": "0"
                      },
                      "borderInlineEnd": {
                        "defaultValue": "0"
                      },
                      "paddingTop": {
                        "defaultValue": "0"
                      },
                      "paddingBottom": {
                        "defaultValue": "0"
                      },
                      "paddingInlineStart": {
                        "defaultValue": "0"
                      },
                      "paddingInlineEnd": {
                        "defaultValue": "0"
                      },
                      "borderStartStartRadius": {
                        "defaultValue": "50%"
                      },
                      "borderStartEndRadius": {
                        "defaultValue": "50%"
                      },
                      "borderEndStartRadius": {
                        "defaultValue": "50%"
                      },
                      "borderEndEndRadius": {
                        "defaultValue": "50%"
                      },
                      "boxShadow": {},
                      "width": {
                        "defaultValue": "38px"
                      },
                      "height": {
                        "defaultValue": "38px"
                      },
                      "overflow": {},
                      "mixBlendMode": {},
                      "display": {
                        "display": {
                          "displayValues": [
                            "none",
                            "grid"
                          ]
                        }
                      },
                      "font": {},
                      "lineHeight": {},
                      "letterSpacing": {},
                      "textDecorationLine": {},
                      "textTransform": {},
                      "textAlign": {},
                      "textShadow": {},
                      "marginTop": {},
                      "marginBottom": {},
                      "marginInlineStart": {},
                      "marginInlineEnd": {},
                      "flexDirection": {},
                      "justifyContent": {},
                      "alignItems": {}
                    },
                    "states": {
                      "saved": {
                        "displayName": "Saved",
                        "className": "property-listings-save--saved"
                      },
                      "hover": {
                        "displayName": "Hover",
                        "className": "property-listings-save--hover",
                        "pseudoClass": "hover"
                      },
                      "disabled": {
                        "displayName": "Disabled",
                        "className": "property-listings-save--disabled",
                        "pseudoClass": "disabled"
                      }
                    },
                    "elements": {
                      "lucide": {
                        "elementType": "inlineElement",
                        "inlineElement": {
                          "selector": ".lucide",
                          "displayName": "Lucide",
                          "behaviors": {
                            "removable": true,
                            "selectable": false
                          },
                          "cssProperties": {
                            "background": {},
                            "borderTop": {},
                            "borderBottom": {},
                            "borderInlineStart": {},
                            "borderInlineEnd": {},
                            "paddingTop": {},
                            "paddingBottom": {},
                            "paddingInlineStart": {},
                            "paddingInlineEnd": {},
                            "borderStartStartRadius": {},
                            "borderStartEndRadius": {},
                            "borderEndStartRadius": {},
                            "borderEndEndRadius": {},
                            "boxShadow": {},
                            "width": {},
                            "height": {},
                            "overflow": {},
                            "mixBlendMode": {},
                            "marginTop": {},
                            "marginBottom": {},
                            "marginInlineStart": {},
                            "marginInlineEnd": {},
                            "display": {
                              "display": {
                                "displayValues": [
                                  "none",
                                  "block"
                                ]
                              }
                            },
                            "alignSelf": {}
                          }
                        }
                      }
                    }
                  }
                },
                "propertyListingsCardPrice": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-listings-card-price",
                    "displayName": "Price",
                    "behaviors": {
                      "removable": true,
                      "selectable": false
                    },
                    "cssProperties": {
                      "font": {},
                      "lineHeight": {},
                      "letterSpacing": {},
                      "textDecorationLine": {},
                      "textTransform": {},
                      "textAlign": {},
                      "textShadow": {},
                      "color": {},
                      "marginInlineStart": {},
                      "marginInlineEnd": {},
                      "display": {
                        "display": {
                          "displayValues": [
                            "none",
                            "inline"
                          ]
                        }
                      }
                    }
                  }
                },
                "propertyListingsCardTitle": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-listings-card-title",
                    "displayName": "Title",
                    "behaviors": {
                      "removable": true,
                      "selectable": false
                    },
                    "cssProperties": {
                      "font": {},
                      "lineHeight": {
                        "defaultValue": "1.25"
                      },
                      "letterSpacing": {},
                      "textDecorationLine": {},
                      "textTransform": {},
                      "textAlign": {},
                      "textShadow": {},
                      "color": {},
                      "marginTop": {
                        "defaultValue": "10px"
                      },
                      "marginBottom": {
                        "defaultValue": "7px"
                      },
                      "marginInlineStart": {
                        "defaultValue": "0"
                      },
                      "marginInlineEnd": {
                        "defaultValue": "0"
                      },
                      "display": {
                        "display": {
                          "displayValues": [
                            "none",
                            "block"
                          ]
                        }
                      }
                    }
                  }
                },
                "propertyListingsLocation": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-listings-location",
                    "displayName": "Location",
                    "behaviors": {
                      "removable": true,
                      "selectable": false
                    },
                    "cssProperties": {
                      "font": {},
                      "lineHeight": {},
                      "letterSpacing": {},
                      "textDecorationLine": {},
                      "textTransform": {},
                      "textAlign": {},
                      "textShadow": {},
                      "color": {
                        "defaultValue": "#68736c"
                      },
                      "display": {
                        "display": {
                          "displayValues": [
                            "none",
                            "flex"
                          ]
                        }
                      },
                      "marginTop": {
                        "defaultValue": "0"
                      },
                      "marginBottom": {
                        "defaultValue": "0"
                      },
                      "marginInlineStart": {
                        "defaultValue": "0"
                      },
                      "marginInlineEnd": {
                        "defaultValue": "0"
                      },
                      "background": {},
                      "borderTop": {},
                      "borderBottom": {},
                      "borderInlineStart": {},
                      "borderInlineEnd": {},
                      "paddingTop": {},
                      "paddingBottom": {},
                      "paddingInlineStart": {},
                      "paddingInlineEnd": {},
                      "borderStartStartRadius": {},
                      "borderStartEndRadius": {},
                      "borderEndStartRadius": {},
                      "borderEndEndRadius": {},
                      "boxShadow": {},
                      "width": {},
                      "height": {},
                      "overflow": {},
                      "mixBlendMode": {},
                      "flexDirection": {},
                      "justifyContent": {},
                      "alignItems": {
                        "defaultValue": "center"
                      }
                    }
                  }
                },
                "propertyListingsMetadata": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-listings-metadata",
                    "displayName": "Metadata",
                    "behaviors": {
                      "removable": true,
                      "selectable": false
                    },
                    "cssProperties": {
                      "font": {},
                      "lineHeight": {},
                      "letterSpacing": {},
                      "textDecorationLine": {},
                      "textTransform": {},
                      "textAlign": {},
                      "textShadow": {},
                      "color": {
                        "defaultValue": "#68736c"
                      },
                      "display": {
                        "display": {
                          "displayValues": [
                            "none",
                            "flex"
                          ]
                        }
                      },
                      "marginTop": {
                        "defaultValue": ".75rem"
                      },
                      "marginBottom": {
                        "defaultValue": "0"
                      },
                      "marginInlineStart": {
                        "defaultValue": "0"
                      },
                      "marginInlineEnd": {
                        "defaultValue": "0"
                      },
                      "background": {},
                      "borderTop": {},
                      "borderBottom": {},
                      "borderInlineStart": {},
                      "borderInlineEnd": {},
                      "paddingTop": {},
                      "paddingBottom": {},
                      "paddingInlineStart": {},
                      "paddingInlineEnd": {},
                      "borderStartStartRadius": {},
                      "borderStartEndRadius": {},
                      "borderEndStartRadius": {},
                      "borderEndEndRadius": {},
                      "boxShadow": {},
                      "width": {},
                      "height": {},
                      "overflow": {},
                      "mixBlendMode": {},
                      "flexDirection": {},
                      "justifyContent": {},
                      "alignItems": {
                        "defaultValue": "center"
                      }
                    }
                  }
                },
                "propertyCompareButton": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-compare-button",
                    "displayName": "Property Compare Button",
                    "behaviors": {
                      "removable": true,
                      "selectable": false
                    },
                    "cssProperties": {
                      "font": {
                        "defaultValue": "600 13px/1.3\"Helvetica Neue\",Helvetica,Arial,sans-serif"
                      },
                      "lineHeight": {},
                      "letterSpacing": {},
                      "textDecorationLine": {
                        "statesDefaultValues": {
                          "disabled": "none",
                          "hover": "underline"
                        }
                      },
                      "textTransform": {},
                      "textAlign": {},
                      "textShadow": {},
                      "color": {
                        "defaultValue": "#0c3b2e"
                      },
                      "display": {
                        "display": {
                          "displayValues": [
                            "none",
                            "inlineFlex"
                          ]
                        }
                      },
                      "marginTop": {
                        "defaultValue": "12px"
                      },
                      "marginBottom": {
                        "defaultValue": "16px"
                      },
                      "marginInlineStart": {
                        "defaultValue": "16px"
                      },
                      "marginInlineEnd": {
                        "defaultValue": "12px"
                      },
                      "background": {},
                      "borderTop": {},
                      "borderBottom": {},
                      "borderInlineStart": {},
                      "borderInlineEnd": {},
                      "paddingTop": {
                        "defaultValue": "4px"
                      },
                      "paddingBottom": {
                        "defaultValue": "4px"
                      },
                      "paddingInlineStart": {
                        "defaultValue": "0"
                      },
                      "paddingInlineEnd": {
                        "defaultValue": "0"
                      },
                      "borderStartStartRadius": {},
                      "borderStartEndRadius": {},
                      "borderEndStartRadius": {},
                      "borderEndEndRadius": {},
                      "boxShadow": {},
                      "width": {},
                      "height": {},
                      "overflow": {},
                      "mixBlendMode": {},
                      "flexDirection": {},
                      "justifyContent": {},
                      "alignItems": {
                        "defaultValue": "center"
                      }
                    },
                    "states": {
                      "disabled": {
                        "displayName": "Disabled",
                        "className": "property-compare-button--disabled"
                      },
                      "selected": {
                        "displayName": "Selected",
                        "className": "property-compare-button--selected"
                      },
                      "hover": {
                        "displayName": "Hover",
                        "className": "property-compare-button--hover",
                        "pseudoClass": "hover"
                      }
                    }
                  }
                },
                "propertyListingsDetailLink": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-listings-detail-link",
                    "displayName": "Detail Link",
                    "behaviors": {
                      "removable": true,
                      "selectable": false
                    },
                    "cssProperties": {
                      "font": {},
                      "lineHeight": {},
                      "letterSpacing": {},
                      "textDecorationLine": {
                        "defaultValue": "none",
                        "statesDefaultValues": {
                          "hover": "underline"
                        }
                      },
                      "textTransform": {},
                      "textAlign": {},
                      "textShadow": {},
                      "color": {
                        "defaultValue": "#0c3b2e"
                      },
                      "display": {
                        "display": {
                          "displayValues": [
                            "none",
                            "inlineBlock"
                          ]
                        }
                      },
                      "marginTop": {
                        "defaultValue": "16px"
                      },
                      "marginBottom": {},
                      "marginInlineStart": {},
                      "marginInlineEnd": {},
                      "background": {},
                      "borderTop": {},
                      "borderBottom": {},
                      "borderInlineStart": {},
                      "borderInlineEnd": {},
                      "paddingTop": {},
                      "paddingBottom": {},
                      "paddingInlineStart": {},
                      "paddingInlineEnd": {},
                      "borderStartStartRadius": {},
                      "borderStartEndRadius": {},
                      "borderEndStartRadius": {},
                      "borderEndEndRadius": {},
                      "boxShadow": {},
                      "width": {},
                      "height": {},
                      "overflow": {},
                      "mixBlendMode": {}
                    },
                    "states": {
                      "hover": {
                        "displayName": "Hover",
                        "className": "property-listings-detail-link--hover",
                        "pseudoClass": "hover"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "propertyListingsPagination": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".property-listings-pagination",
        "displayName": "Pagination",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "background": {},
          "borderTop": {},
          "borderBottom": {},
          "borderInlineStart": {},
          "borderInlineEnd": {},
          "paddingTop": {},
          "paddingBottom": {},
          "paddingInlineStart": {},
          "paddingInlineEnd": {},
          "borderStartStartRadius": {},
          "borderStartEndRadius": {},
          "borderEndStartRadius": {},
          "borderEndEndRadius": {},
          "boxShadow": {},
          "width": {},
          "height": {},
          "overflow": {},
          "mixBlendMode": {},
          "display": {
            "display": {
              "displayValues": [
                "none",
                "flex"
              ]
            }
          },
          "marginTop": {
            "defaultValue": "16px"
          },
          "marginBottom": {},
          "marginInlineStart": {},
          "marginInlineEnd": {},
          "gap": {
            "defaultValue": "10px"
          },
          "flexDirection": {},
          "justifyContent": {
            "defaultValue": "center"
          },
          "alignItems": {
            "defaultValue": "center"
          },
          "alignSelf": {}
        },
        "elements": {
          "propertyListingsPageButton": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".property-listings-page-button",
              "displayName": "Page Button",
              "behaviors": {
                "removable": true,
                "selectable": false
              },
              "cssProperties": {
                "color": {
                  "defaultValue": "#fff"
                },
                "background": {
                  "defaultValue": "#0c3b2e",
                  "statesDefaultValues": {
                    "current": "#195440",
                    "hover": "#195440"
                  }
                },
                "borderTop": {
                  "defaultValue": "1px solid #0c3b2e"
                },
                "borderBottom": {
                  "defaultValue": "1px solid #0c3b2e"
                },
                "borderInlineStart": {
                  "defaultValue": "1px solid #0c3b2e"
                },
                "borderInlineEnd": {
                  "defaultValue": "1px solid #0c3b2e"
                },
                "paddingTop": {
                  "defaultValue": "9px"
                },
                "paddingBottom": {
                  "defaultValue": "9px"
                },
                "paddingInlineStart": {
                  "defaultValue": ".55rem"
                },
                "paddingInlineEnd": {
                  "defaultValue": ".55rem"
                },
                "borderStartStartRadius": {
                  "defaultValue": "10px"
                },
                "borderStartEndRadius": {
                  "defaultValue": "10px"
                },
                "borderEndStartRadius": {
                  "defaultValue": "10px"
                },
                "borderEndEndRadius": {
                  "defaultValue": "10px"
                },
                "boxShadow": {
                  "statesDefaultValues": {
                    "current": "inset 0 0 0 2px currentColor"
                  }
                },
                "width": {},
                "height": {},
                "overflow": {},
                "mixBlendMode": {},
                "display": {
                  "display": {
                    "displayValues": [
                      "none",
                      "inlineFlex"
                    ]
                  }
                },
                "font": {
                  "defaultValue": "inherit"
                },
                "lineHeight": {},
                "letterSpacing": {},
                "textDecorationLine": {},
                "textTransform": {},
                "textAlign": {},
                "textShadow": {},
                "marginTop": {},
                "marginBottom": {},
                "marginInlineStart": {},
                "marginInlineEnd": {},
                "flexDirection": {},
                "justifyContent": {
                  "defaultValue": "center"
                },
                "alignItems": {
                  "defaultValue": "center"
                },
                "alignSelf": {}
              },
              "states": {
                "current": {
                  "displayName": "Current",
                  "className": "property-listings-page-button--current"
                },
                "hover": {
                  "displayName": "Hover",
                  "className": "property-listings-page-button--hover",
                  "pseudoClass": "hover"
                },
                "disabled": {
                  "displayName": "Disabled",
                  "className": "property-listings-page-button--disabled",
                  "pseudoClass": "disabled"
                }
              }
            }
          }
        }
      }
    }
  },
  "cssProperties": {
    "background": {
      "defaultValue": "transparent"
    },
    "borderTop": {},
    "borderBottom": {},
    "borderInlineStart": {},
    "borderInlineEnd": {},
    "paddingTop": {
      "defaultValue": "20px"
    },
    "paddingBottom": {
      "defaultValue": "20px"
    },
    "paddingInlineStart": {
      "defaultValue": "20px"
    },
    "paddingInlineEnd": {
      "defaultValue": "20px"
    },
    "borderStartStartRadius": {},
    "borderStartEndRadius": {},
    "borderEndStartRadius": {},
    "borderEndEndRadius": {},
    "boxShadow": {},
    "overflow": {
      "defaultValue": "hidden"
    },
    "mixBlendMode": {},
    "gap": {},
    "flexDirection": {
      "defaultValue": "column"
    },
    "justifyContent": {},
    "alignItems": {}
  },
  "cssCustomProperties": {}
} as EditorElement;

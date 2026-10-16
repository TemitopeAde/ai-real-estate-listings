/**
 * THIS FILE IS AUTO-GENERATED — DO NOT EDIT.
 * It contains the `editorElement` portion of the manifest, automatically derived from your component's
 * source code, prop types, and CSS rules.
 * Update your source code and run `npx wix build && npx wix generate manifest` to regenerate it.
 * If you need to override specific manifest values (sizing, layout, etc.),
 * you can do so in property-detail.extension.ts.
 */

import type { EditorElement } from '@wix/react-component-schema';

export const editorElement = {
  "selector": ".property-detail",
  "displayName": "Property Detail",
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
    "listingId": {
      "displayName": "Listing Id",
      "dataType": "text",
      "text": {}
    },
    "relatedTitle": {
      "displayName": "Related Title",
      "dataType": "text",
      "text": {}
    },
    "relatedSubtitle": {
      "displayName": "Related Subtitle",
      "dataType": "text",
      "text": {}
    },
    "relatedCount": {
      "displayName": "Related Count",
      "dataType": "number",
      "number": {
        "min": "1",
        "max": "8"
      }
    },
    "enableRelatedListings": {
      "displayName": "Enable Related Listings",
      "dataType": "booleanValue"
    },
    "enableAssistant": {
      "displayName": "Enable Assistant",
      "dataType": "booleanValue"
    },
    "enableSocialShare": {
      "displayName": "Enable Social Share",
      "dataType": "booleanValue"
    },
    "enableMortgageCalculator": {
      "displayName": "Enable Mortgage Calculator",
      "dataType": "booleanValue"
    },
    "enableFloorPlans": {
      "displayName": "Enable Floor Plans",
      "dataType": "booleanValue"
    },
    "enableBrochures": {
      "displayName": "Enable Brochures",
      "dataType": "booleanValue"
    },
    "enableVideos": {
      "displayName": "Enable Videos",
      "dataType": "booleanValue"
    }
  },
  "elements": {
    "propertyDetailMessage": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".property-detail-message",
        "displayName": "Message",
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
                "block"
              ]
            }
          },
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
          "alignSelf": {}
        }
      }
    },
    "propertyDetailCard": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".property-detail-card",
        "displayName": "Card",
        "behaviors": {
          "removable": true,
          "selectable": false
        },
        "cssProperties": {
          "background": {
            "defaultValue": "#fff"
          },
          "borderTop": {},
          "borderBottom": {},
          "borderInlineStart": {},
          "borderInlineEnd": {},
          "paddingTop": {},
          "paddingBottom": {},
          "paddingInlineStart": {},
          "paddingInlineEnd": {},
          "borderStartStartRadius": {
            "defaultValue": "20px"
          },
          "borderStartEndRadius": {
            "defaultValue": "20px"
          },
          "borderEndStartRadius": {
            "defaultValue": "20px"
          },
          "borderEndEndRadius": {
            "defaultValue": "20px"
          },
          "boxShadow": {
            "defaultValue": "0 16px 40px #17211b1a"
          },
          "width": {
            "defaultValue": "100%"
          },
          "height": {},
          "overflow": {
            "defaultValue": "hidden"
          },
          "mixBlendMode": {},
          "marginTop": {},
          "marginBottom": {},
          "marginInlineStart": {
            "defaultValue": "auto"
          },
          "marginInlineEnd": {
            "defaultValue": "auto"
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
                  "defaultValue": "24px"
                },
                "paddingBottom": {
                  "defaultValue": "24px"
                },
                "paddingInlineStart": {
                  "defaultValue": "24px"
                },
                "paddingInlineEnd": {
                  "defaultValue": "24px"
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
                  "defaultValue": "var(--detail-margin)"
                },
                "marginBottom": {
                  "defaultValue": "var(--detail-margin)"
                },
                "marginInlineStart": {
                  "defaultValue": "var(--detail-margin)"
                },
                "marginInlineEnd": {
                  "defaultValue": "var(--detail-margin)"
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
                      "paddingTop": {
                        "defaultValue": ".5rem"
                      },
                      "paddingBottom": {
                        "defaultValue": ".5rem"
                      },
                      "paddingInlineStart": {
                        "defaultValue": ".875rem"
                      },
                      "paddingInlineEnd": {
                        "defaultValue": ".875rem"
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
          "propertyDetailContent": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".property-detail-content",
              "displayName": "Content",
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
                "paddingTop": {
                  "defaultValue": "clamp(18px,4.5cqi,48px)"
                },
                "paddingBottom": {
                  "defaultValue": "clamp(18px,4.5cqi,48px)"
                },
                "paddingInlineStart": {
                  "defaultValue": "clamp(18px,4.5cqi,48px)"
                },
                "paddingInlineEnd": {
                  "defaultValue": "clamp(18px,4.5cqi,48px)"
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
                      "block"
                    ]
                  }
                }
              },
              "elements": {
                "propertyDetailBackLink": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-back-link",
                    "displayName": "Back Link",
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
                    },
                    "states": {
                      "hover": {
                        "displayName": "Hover",
                        "className": "property-detail-back-link--hover",
                        "pseudoClass": "hover"
                      }
                    }
                  }
                },
                "propertyDetailHeading": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-heading",
                    "displayName": "Heading",
                    "behaviors": {
                      "removable": true,
                      "selectable": false
                    },
                    "cssProperties": {
                      "font": {},
                      "lineHeight": {
                        "defaultValue": "1.1"
                      },
                      "letterSpacing": {
                        "defaultValue": "-.04em"
                      },
                      "textDecorationLine": {},
                      "textTransform": {},
                      "textAlign": {},
                      "textShadow": {},
                      "color": {},
                      "display": {
                        "display": {
                          "displayValues": [
                            "none",
                            "grid"
                          ]
                        }
                      },
                      "marginTop": {
                        "defaultValue": "2rem"
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
                      "justifyContent": {
                        "defaultValue": "space-between"
                      },
                      "alignItems": {
                        "defaultValue": "start"
                      }
                    }
                  }
                },
                "propertyDetailLocation": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-location",
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
                        "defaultValue": "10px"
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
                "propertyDetailPrice": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-price",
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
                      "color": {
                        "defaultValue": "#0c3b2e"
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
                            "inline"
                          ]
                        }
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
                        "defaultValue": "0"
                      },
                      "marginBottom": {
                        "defaultValue": "14px"
                      },
                      "marginInlineStart": {
                        "defaultValue": "14px"
                      },
                      "marginInlineEnd": {
                        "defaultValue": "14px"
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
                "propertyDetailSave": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-save",
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
                        "defaultValue": "#e7eeeb",
                        "statesDefaultValues": {
                          "saved": "#c9e2d3",
                          "hover": "#d9e9df"
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
                        "defaultValue": "40px"
                      },
                      "height": {
                        "defaultValue": "40px"
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
                        "className": "property-detail-save--saved"
                      },
                      "hover": {
                        "displayName": "Hover",
                        "className": "property-detail-save--hover",
                        "pseudoClass": "hover"
                      },
                      "disabled": {
                        "displayName": "Disabled",
                        "className": "property-detail-save--disabled",
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
                "propertyDetailViews": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-views",
                    "displayName": "Views",
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
                            "inlineFlex"
                          ]
                        }
                      },
                      "marginTop": {
                        "defaultValue": "1rem"
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
                "propertyDetailShare": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-share",
                    "displayName": "Share",
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
                      "marginTop": {
                        "defaultValue": "2rem"
                      },
                      "marginBottom": {
                        "defaultValue": "1.5rem"
                      },
                      "marginInlineStart": {},
                      "marginInlineEnd": {},
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
                "propertyDetailAssistant": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-assistant",
                    "displayName": "Assistant",
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
                      "marginTop": {
                        "defaultValue": "2rem"
                      },
                      "marginBottom": {
                        "defaultValue": "1.5rem"
                      },
                      "marginInlineStart": {},
                      "marginInlineEnd": {},
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
                "propertyDetailTour": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-tour",
                    "displayName": "Tour",
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
                      "marginTop": {
                        "defaultValue": "2rem"
                      },
                      "marginBottom": {
                        "defaultValue": "1.5rem"
                      },
                      "marginInlineStart": {},
                      "marginInlineEnd": {},
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
                "propertyDetailVideos": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-videos",
                    "displayName": "Videos",
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
                      "marginTop": {
                        "defaultValue": "2rem"
                      },
                      "marginBottom": {
                        "defaultValue": "1.5rem"
                      },
                      "marginInlineStart": {},
                      "marginInlineEnd": {},
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
                "propertyDetailDescription": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-description",
                    "displayName": "Description",
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
                      "marginTop": {
                        "defaultValue": "2rem"
                      },
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
                      }
                    }
                  }
                },
                "propertyDetailMetadata": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-metadata",
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
                        "defaultValue": "2rem"
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
                      "borderTop": {
                        "defaultValue": "1px solid color-mix(in srgb,var(--detail-muted) 25%,transparent)"
                      },
                      "borderBottom": {
                        "defaultValue": "1px solid color-mix(in srgb,var(--detail-muted) 25%,transparent)"
                      },
                      "borderInlineStart": {},
                      "borderInlineEnd": {},
                      "paddingTop": {
                        "defaultValue": "16px"
                      },
                      "paddingBottom": {
                        "defaultValue": "16px"
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
                      "alignItems": {}
                    }
                  }
                },
                "propertyDetailMortgage": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-mortgage",
                    "displayName": "Mortgage",
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
                      "marginTop": {
                        "defaultValue": "2rem"
                      },
                      "marginBottom": {
                        "defaultValue": "1.5rem"
                      },
                      "marginInlineStart": {},
                      "marginInlineEnd": {},
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
                "propertyDetailMap": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-map",
                    "displayName": "Map",
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
                      "marginTop": {
                        "defaultValue": "2rem"
                      },
                      "marginBottom": {
                        "defaultValue": "1.5rem"
                      },
                      "marginInlineStart": {},
                      "marginInlineEnd": {},
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
                "propertyDetailAmenities": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-amenities",
                    "displayName": "Amenities",
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
                      "marginTop": {
                        "defaultValue": "2rem"
                      },
                      "marginBottom": {
                        "defaultValue": "1.5rem"
                      },
                      "marginInlineStart": {},
                      "marginInlineEnd": {},
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
                "propertyDetailContact": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-contact",
                    "displayName": "Contact",
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
                      "marginTop": {
                        "defaultValue": "2rem"
                      },
                      "marginBottom": {
                        "defaultValue": "1.5rem"
                      },
                      "marginInlineStart": {},
                      "marginInlineEnd": {},
                      "display": {
                        "display": {
                          "displayValues": [
                            "none",
                            "block"
                          ]
                        }
                      }
                    },
                    "elements": {
                      "propertyDetailContactLink": {
                        "elementType": "inlineElement",
                        "inlineElement": {
                          "selector": ".property-detail-contact-link",
                          "displayName": "Link",
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
                              "defaultValue": "#0c3b2e",
                              "statesDefaultValues": {
                                "hover": "#26704c"
                              }
                            },
                            "display": {
                              "display": {
                                "displayValues": [
                                  "none",
                                  "inlineBlock"
                                ]
                              }
                            },
                            "marginTop": {},
                            "marginBottom": {},
                            "marginInlineStart": {},
                            "marginInlineEnd": {
                              "defaultValue": "12px"
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
                            "mixBlendMode": {}
                          },
                          "states": {
                            "hover": {
                              "displayName": "Hover",
                              "className": "property-detail-contact-link--hover",
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
          }
        }
      }
    },
    "propertyDetailRelated": {
      "elementType": "inlineElement",
      "inlineElement": {
        "selector": ".property-detail-related",
        "displayName": "Related",
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
            "defaultValue": "32px"
          },
          "marginBottom": {
            "defaultValue": "0"
          },
          "marginInlineStart": {
            "defaultValue": "auto"
          },
          "marginInlineEnd": {
            "defaultValue": "auto"
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
        },
        "elements": {
          "propertyDetailRelatedTitle": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".property-detail-related-title",
              "displayName": "Title",
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
                }
              }
            }
          },
          "propertyDetailRelatedSubtitle": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".property-detail-related-subtitle",
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
                }
              }
            }
          },
          "propertyDetailRelatedControl": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".property-detail-related-control",
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
                  "defaultValue": "#fff",
                  "statesDefaultValues": {
                    "hover": "#e7eeeb"
                  }
                },
                "borderTop": {
                  "defaultValue": "1px solid #cbd2cd"
                },
                "borderBottom": {
                  "defaultValue": "1px solid #cbd2cd"
                },
                "borderInlineStart": {
                  "defaultValue": "1px solid #cbd2cd"
                },
                "borderInlineEnd": {
                  "defaultValue": "1px solid #cbd2cd"
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
                  "defaultValue": "36px"
                },
                "height": {
                  "defaultValue": "36px"
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
                "hover": {
                  "displayName": "Hover",
                  "className": "property-detail-related-control--hover",
                  "pseudoClass": "hover"
                },
                "disabled": {
                  "displayName": "Disabled",
                  "className": "property-detail-related-control--disabled",
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
          "propertyDetailRelatedList": {
            "elementType": "inlineElement",
            "inlineElement": {
              "selector": ".property-detail-related-list",
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
                "paddingTop": {
                  "defaultValue": "2px"
                },
                "paddingBottom": {
                  "defaultValue": "12px"
                },
                "paddingInlineStart": {
                  "defaultValue": "2px"
                },
                "paddingInlineEnd": {
                  "defaultValue": "2px"
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
                "gap": {
                  "defaultValue": "20px"
                },
                "flexDirection": {},
                "justifyContent": {},
                "alignItems": {}
              },
              "elements": {
                "propertyDetailRelatedCard": {
                  "elementType": "inlineElement",
                  "inlineElement": {
                    "selector": ".property-detail-related-card",
                    "displayName": "Card",
                    "behaviors": {
                      "removable": true,
                      "selectable": false
                    },
                    "cssProperties": {
                      "background": {
                        "defaultValue": "#fff"
                      },
                      "borderTop": {},
                      "borderBottom": {},
                      "borderInlineStart": {},
                      "borderInlineEnd": {},
                      "paddingTop": {},
                      "paddingBottom": {},
                      "paddingInlineStart": {},
                      "paddingInlineEnd": {},
                      "borderStartStartRadius": {
                        "defaultValue": "20px"
                      },
                      "borderStartEndRadius": {
                        "defaultValue": "20px"
                      },
                      "borderEndStartRadius": {
                        "defaultValue": "20px"
                      },
                      "borderEndEndRadius": {
                        "defaultValue": "20px"
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
                              "defaultValue": "24px"
                            },
                            "paddingBottom": {
                              "defaultValue": "24px"
                            },
                            "paddingInlineStart": {
                              "defaultValue": "24px"
                            },
                            "paddingInlineEnd": {
                              "defaultValue": "24px"
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
                              "defaultValue": "var(--detail-margin)"
                            },
                            "marginBottom": {
                              "defaultValue": "var(--detail-margin)"
                            },
                            "marginInlineStart": {
                              "defaultValue": "var(--detail-margin)"
                            },
                            "marginInlineEnd": {
                              "defaultValue": "var(--detail-margin)"
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
                                  "paddingTop": {
                                    "defaultValue": ".5rem"
                                  },
                                  "paddingBottom": {
                                    "defaultValue": ".5rem"
                                  },
                                  "paddingInlineStart": {
                                    "defaultValue": ".875rem"
                                  },
                                  "paddingInlineEnd": {
                                    "defaultValue": ".875rem"
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
                      "propertyDetailRelatedLink": {
                        "elementType": "inlineElement",
                        "inlineElement": {
                          "selector": ".property-detail-related-link",
                          "displayName": "Link",
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
                              "defaultValue": "#17211b"
                            },
                            "display": {
                              "display": {
                                "displayValues": [
                                  "none",
                                  "inlineBlock"
                                ]
                              }
                            },
                            "marginTop": {},
                            "marginBottom": {
                              "defaultValue": "10px"
                            },
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
                              "className": "property-detail-related-link--hover",
                              "pseudoClass": "hover"
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
                              "defaultValue": "0"
                            },
                            "marginBottom": {
                              "defaultValue": "14px"
                            },
                            "marginInlineStart": {
                              "defaultValue": "14px"
                            },
                            "marginInlineEnd": {
                              "defaultValue": "14px"
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
                      "propertyDetailSave": {
                        "elementType": "inlineElement",
                        "inlineElement": {
                          "selector": ".property-detail-save",
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
                              "defaultValue": "#e7eeeb",
                              "statesDefaultValues": {
                                "saved": "#c9e2d3",
                                "hover": "#d9e9df"
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
                              "defaultValue": "40px"
                            },
                            "height": {
                              "defaultValue": "40px"
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
                              "className": "property-detail-save--saved"
                            },
                            "hover": {
                              "displayName": "Hover",
                              "className": "property-detail-save--hover",
                              "pseudoClass": "hover"
                            },
                            "disabled": {
                              "displayName": "Disabled",
                              "className": "property-detail-save--disabled",
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
                      }
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
  "cssProperties": {
    "background": {
      "defaultValue": "transparent"
    },
    "borderTop": {},
    "borderBottom": {},
    "borderInlineStart": {},
    "borderInlineEnd": {},
    "paddingTop": {
      "defaultValue": "24px"
    },
    "paddingBottom": {
      "defaultValue": "24px"
    },
    "paddingInlineStart": {
      "defaultValue": "24px"
    },
    "paddingInlineEnd": {
      "defaultValue": "24px"
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
  "cssCustomProperties": {
    "detail-card": {
      "displayName": "Detail Card",
      "defaultValue": "#fff",
      "cssPropertyType": "background"
    },
    "detail-text": {
      "displayName": "Detail Text",
      "defaultValue": "#17211b",
      "cssPropertyType": "color"
    },
    "detail-muted": {
      "displayName": "Detail Muted",
      "defaultValue": "#68736c",
      "cssPropertyType": "color"
    },
    "detail-accent": {
      "displayName": "Detail Accent",
      "defaultValue": "#0c3b2e",
      "cssPropertyType": "color"
    },
    "detail-shadow": {
      "displayName": "Detail Shadow",
      "defaultValue": "0 12px 30px #17211b14",
      "cssPropertyType": "boxShadow"
    }
  }
} as EditorElement;

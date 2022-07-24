import { defineComponent, ref, reactive, computed, onMounted, onBeforeUnmount, watch, toRefs, openBlock, createElementBlock, renderSlot, normalizeProps, guardReactiveProps, createElementVNode, normalizeClass, normalizeStyle, createCommentVNode, Fragment, renderList, withDirectives, vShow } from "vue";
import { identity, multiply, perspective, translate, translate3d, rotateY, toString } from "rematrix";
class MatrixM {
  constructor(arg) {
    Object.defineProperty(this, "m", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    if (arg) {
      if (arg.m) {
        this.m = [...Array.from(arg.m)];
      } else {
        this.m = [...Array.from(arg)];
      }
    } else {
      this.m = identity();
    }
  }
  clone() {
    return new MatrixM(this);
  }
  multiply(m) {
    return this.m = multiply(this.m, m);
  }
  perspective(d) {
    return this.multiply(perspective(d));
  }
  transformX(x) {
    return (x * this.m[0] + this.m[12]) / (x * this.m[3] + this.m[15]);
  }
  translate(x, y) {
    return this.multiply(translate(x, y));
  }
  translate3d(x, y, z) {
    return this.multiply(translate3d(x, y, z));
  }
  rotateY(deg) {
    return this.multiply(rotateY(deg));
  }
  toString() {
    return toString(this.m);
  }
}
var spinner = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9InRyYW5zcGFyZW50IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjogI2ZmZiI+CiAgPGNpcmNsZQogICAgY3g9IjI1MCIKICAgIGN5PSIyNTAiCiAgICByPSI0OCIKICAgIHN0cm9rZT0iIzMzMyIKICAgIHN0cm9rZS13aWR0aD0iMiIKICAgIHN0cm9rZS1kYXNoYXJyYXk9IjI3MSAzMCIKICA+CiAgICA8YW5pbWF0ZVRyYW5zZm9ybQogICAgICBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iCiAgICAgIGF0dHJpYnV0ZVR5cGU9IlhNTCIKICAgICAgdHlwZT0icm90YXRlIgogICAgICBmcm9tPSIwIDI1MCAyNTAiCiAgICAgIHRvPSIzNjAgMjUwIDI1MCIKICAgICAgZHVyPSIxcyIKICAgICAgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiCiAgICAvPgogIDwvY2lyY2xlPgo8L3N2Zz4K";
var Flipbook_vue_vue_type_style_index_0_scoped_true_lang = "";
var _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const easeIn = (x) => Math.pow(x, 2);
const easeOut = (x) => 1 - easeIn(1 - x);
const easeInOut = function(x) {
  if (x < 0.5) {
    return easeIn(x * 2) / 2;
  } else {
    return 0.5 + easeOut((x - 0.5) * 2) / 2;
  }
};
const _sfc_main = defineComponent({
  name: "FlipBook",
  props: {
    pages: {
      type: Array,
      required: true
    },
    pagesHiRes: {
      type: Array,
      default() {
        return [];
      }
    },
    zooms: {
      type: Array,
      default: () => [1, 2, 4]
    },
    clickToZoom: {
      type: Boolean,
      default: true
    },
    dragToFlip: {
      type: Boolean,
      default: true
    },
    flipDuration: {
      type: Number,
      default: 1e3
    },
    zoomDuration: {
      type: Number,
      default: 500
    },
    perspective: {
      type: Number,
      default: 2400
    },
    nPolygons: {
      type: Number,
      default: 10
    },
    ambient: {
      type: Number,
      default: 0.4
    },
    gloss: {
      type: Number,
      default: 0.6
    },
    swipeMin: {
      type: Number,
      default: 3
    },
    singlePage: {
      type: Boolean,
      default: false
    },
    centering: {
      type: Boolean,
      default: true
    },
    startPage: {
      type: Number,
      default: null
    },
    loadingImage: {
      type: String,
      default: null
    },
    forwardDirection: {
      type: String,
      validator: (val) => val === "right" || val === "left",
      default: () => "right"
    }
  },
  emits: ["flip-left-start", "flip-left-end", "flip-right-start", "flip-right-end", "zoom-end", "zoom-start"],
  setup(props, ctx) {
    const viewport = ref();
    const data = reactive({
      viewWidth: 0,
      viewHeight: 0,
      imageWidth: null,
      imageHeight: null,
      displayedPages: 1,
      nImageLoad: 0,
      nImageLoadTrigger: 0,
      imageLoadCallback: null,
      currentPage: 0,
      firstPage: 0,
      secondPage: 1,
      zoomIndex: 0,
      zoom: 1,
      zooming: false,
      touchStartX: null,
      touchStartY: null,
      maxMove: 0,
      activeCursor: null,
      hasTouchEvents: false,
      hasPointerEvents: false,
      minX: Infinity,
      maxX: -Infinity,
      preloadedImages: {},
      flip: {
        progress: 0,
        direction: null,
        frontImage: null,
        backImage: null,
        auto: false,
        opacity: 1
      },
      currentCenterOffset: 0,
      animatingCenter: false,
      startScrollLeft: 0,
      startScrollTop: 0,
      scrollLeft: 0,
      scrollTop: 0,
      loadedImages: {}
    });
    const canFlipLeft = computed(() => {
      if (props.forwardDirection === "left") {
        return canGoForward.value;
      } else {
        return canGoBack.value;
      }
    });
    const canFlipRight = computed(() => {
      if (props.forwardDirection === "right") {
        return canGoForward.value;
      } else {
        return canGoBack.value;
      }
    });
    const canZoomIn = computed(() => {
      return !data.zooming && data.zoomIndex < zooms.value.length - 1;
    });
    const canZoomOut = computed(() => {
      return !data.zooming && data.zoomIndex > 0;
    });
    const numPages = computed(() => {
      if (props.pages[0] === null) {
        return props.pages.length - 1;
      } else {
        return props.pages.length;
      }
    });
    const page = computed(() => {
      if (props.pages[0] !== null) {
        return data.currentPage + 1;
      } else {
        return Math.max(1, data.currentPage);
      }
    });
    const zooms = computed(() => {
      return props.zooms || [1];
    });
    const canGoForward = computed(() => {
      return !data.flip.direction && data.currentPage < props.pages.length - data.displayedPages;
    });
    const canGoBack = computed(() => {
      return !data.flip.direction && data.currentPage >= data.displayedPages && !(data.displayedPages === 1 && !pageUrl(data.firstPage - 1));
    });
    const leftPage = computed(() => {
      if (props.forwardDirection === "right" || data.displayedPages === 1) {
        return data.firstPage;
      } else {
        return data.secondPage;
      }
    });
    const rightPage = computed(() => {
      if (props.forwardDirection === "left") {
        return data.firstPage;
      } else {
        return data.secondPage;
      }
    });
    const showLeftPage = computed(() => {
      return pageUrl(leftPage.value);
    });
    const showRightPage = computed(() => {
      return pageUrl(rightPage.value) && data.displayedPages === 2;
    });
    const cursor = computed(() => {
      if (data.activeCursor) {
        return data.activeCursor;
      } else if (props.clickToZoom && canZoomIn.value) {
        return "zoom-in";
      } else if (props.clickToZoom && canZoomOut.value) {
        return "zoom-out";
      } else if (props.dragToFlip) {
        return "grab";
      }
      return "auto";
    });
    const pageScale = computed(() => {
      const vw = data.viewWidth / data.displayedPages;
      const xScale = vw / data.imageWidth;
      const yScale = data.viewHeight / data.imageHeight;
      const scale = xScale < yScale ? xScale : yScale;
      if (scale < 1) {
        return scale;
      } else {
        return 1;
      }
    });
    const pageWidth = computed(() => {
      return Math.round(data.imageWidth * pageScale.value);
    });
    const pageHeight = computed(() => {
      return Math.round(data.imageHeight * pageScale.value);
    });
    const xMargin = computed(() => {
      return (data.viewWidth - pageWidth.value * data.displayedPages) / 2;
    });
    const yMargin = computed(() => {
      return (data.viewHeight - pageHeight.value) / 2;
    });
    const polygonWidth = computed(() => {
      let w = pageWidth.value / props.nPolygons;
      w = Math.ceil(w + 1 / data.zoom);
      return w + "px";
    });
    const polygonHeight = computed(() => {
      return pageHeight.value + "px";
    });
    const polygonBgSize = computed(() => {
      return `${pageWidth.value}px ${pageHeight.value}px`;
    });
    const polygonArray = computed(() => {
      return makePolygonArray("front").concat(makePolygonArray("back"));
    });
    const boundingLeft = computed(() => {
      if (data.displayedPages === 1) {
        return xMargin.value;
      } else {
        const x = pageUrl(leftPage.value) ? xMargin.value : data.viewWidth / 2;
        if (x < data.minX) {
          return x;
        } else {
          return data.minX;
        }
      }
    });
    const boundingRight = computed(() => {
      if (data.displayedPages === 1) {
        return data.viewWidth - xMargin.value;
      } else {
        const x = pageUrl(rightPage.value) ? data.viewWidth - xMargin.value : data.viewWidth / 2;
        if (x > data.maxX) {
          return x;
        } else {
          return data.maxX;
        }
      }
    });
    const centerOffset = computed(() => {
      const retval = props.centering ? Math.round(data.viewWidth / 2 - (boundingLeft.value + boundingRight.value) / 2) : 0;
      if (data.currentCenterOffset === null && data.imageWidth !== null) {
        data.currentCenterOffset = retval;
      }
      return retval;
    });
    const centerOffsetSmoothed = computed(() => {
      return Math.round(data.currentCenterOffset);
    });
    const dragToScroll = computed(() => {
      return !data.hasTouchEvents;
    });
    const scrollLeftMin = computed(() => {
      const w = (boundingRight.value - boundingLeft.value) * data.zoom;
      if (w < data.viewWidth) {
        return (boundingLeft.value + centerOffsetSmoothed.value) * data.zoom - (data.viewWidth - w) / 2;
      } else {
        return (boundingLeft.value + centerOffsetSmoothed.value) * data.zoom;
      }
    });
    const scrollLeftMax = computed(() => {
      const w = (boundingRight.value - boundingLeft.value) * data.zoom;
      if (w < data.viewWidth) {
        return (boundingLeft.value + centerOffsetSmoothed.value) * data.zoom - (data.viewWidth - w) / 2;
      } else {
        return (boundingRight.value + centerOffsetSmoothed.value) * data.zoom - data.viewWidth;
      }
    });
    const scrollTopMin = computed(() => {
      const h = pageHeight.value * data.zoom;
      if (h < data.viewHeight) {
        return yMargin.value * data.zoom - (data.viewHeight - h) / 2;
      } else {
        return yMargin.value * data.zoom;
      }
    });
    const scrollTopMax = computed(() => {
      const h = pageHeight.value * data.zoom;
      if (h < data.viewHeight) {
        return yMargin.value * data.zoom - (data.viewHeight - h) / 2;
      } else {
        return (yMargin.value + pageHeight.value) * data.zoom - data.viewHeight;
      }
    });
    const scrollLeftLimited = computed(() => {
      return Math.min(scrollLeftMax.value, Math.max(scrollLeftMin.value, data.scrollLeft));
    });
    const scrollTopLimited = computed(() => {
      return Math.min(scrollTopMax.value, Math.max(scrollTopMin.value, data.scrollTop));
    });
    onMounted(() => {
      window.addEventListener("resize", onResize, { passive: true });
      onResize();
      data.zoom = zooms.value[0];
      goToPage(props.startPage);
    });
    onBeforeUnmount(() => {
      return window.removeEventListener("resize", onResize);
    });
    const onResize = () => {
      if (!viewport.value) {
        return;
      }
      data.viewWidth = viewport.value.clientWidth;
      data.viewHeight = viewport.value.clientHeight;
      data.displayedPages = data.viewWidth > data.viewHeight && !props.singlePage ? 2 : 1;
      if (data.displayedPages === 2) {
        data.currentPage &= ~1;
      }
      fixFirstPage();
      data.minX = Infinity;
      return data.maxX = -Infinity;
    };
    const fixFirstPage = () => {
      if (data.displayedPages === 1 && data.currentPage === 0 && props.pages.length && !pageUrl(0)) {
        return data.currentPage++;
      }
    };
    const pageUrl = (page2, hiRes) => {
      if (hiRes === void 0) {
        hiRes = false;
      }
      if (hiRes && data.zoom > 1 && !data.zooming) {
        const url = props.pagesHiRes[page2];
        if (url) {
          return url;
        }
      }
      return props.pages[page2] || null;
    };
    const pageUrlLoading = (page2, hiRes) => {
      if (hiRes === void 0) {
        hiRes = false;
      }
      const url = pageUrl(page2, hiRes);
      if (hiRes && data.zoom > 1 && !data.zooming) {
        return url;
      }
      return url && loadImage(url);
    };
    const flipLeft = () => {
      if (!canFlipLeft.value) {
        return;
      }
      return flipStart("left", true);
    };
    const flipRight = () => {
      if (!canFlipRight.value) {
        return;
      }
      return flipStart("right", true);
    };
    const makePolygonArray = (face) => {
      let theta;
      if (!data.flip.direction) {
        return [];
      }
      let {
        progress
      } = data.flip;
      let {
        direction
      } = data.flip;
      if (data.displayedPages === 1 && direction !== props.forwardDirection) {
        progress = 1 - progress;
        direction = props.forwardDirection;
      }
      data.flip.opacity = data.displayedPages === 1 && progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
      const image = face === "front" ? data.flip.frontImage : data.flip.backImage;
      const polygonWidth2 = pageWidth.value / props.nPolygons;
      let pageX = xMargin.value;
      let originRight = false;
      if (data.displayedPages === 1) {
        if (props.forwardDirection === "right") {
          if (face === "back") {
            originRight = true;
            pageX = xMargin.value - pageWidth.value;
          }
        } else {
          if (direction === "left") {
            if (face === "back") {
              pageX = pageWidth.value - xMargin.value;
            } else {
              originRight = true;
            }
          } else {
            if (face === "front") {
              pageX = pageWidth.value - xMargin.value;
            } else {
              originRight = true;
            }
          }
        }
      } else {
        if (direction === "left") {
          if (face === "back") {
            pageX = data.viewWidth / 2;
          } else {
            originRight = true;
          }
        } else {
          if (face === "front") {
            pageX = data.viewWidth / 2;
          } else {
            originRight = true;
          }
        }
      }
      const pageMatrix = new MatrixM();
      pageMatrix.translate(data.viewWidth / 2);
      pageMatrix.perspective(props.perspective);
      pageMatrix.translate(-data.viewWidth / 2);
      pageMatrix.translate(pageX, yMargin.value);
      let pageRotation = 0;
      if (progress > 0.5) {
        pageRotation = -(progress - 0.5) * 2 * 180;
      }
      if (direction === "left") {
        pageRotation = -pageRotation;
      }
      if (face === "back") {
        pageRotation += 180;
      }
      if (pageRotation) {
        if (originRight) {
          pageMatrix.translate(pageWidth.value);
        }
        pageMatrix.rotateY(pageRotation);
        if (originRight) {
          pageMatrix.translate(-pageWidth.value);
        }
      }
      if (progress < 0.5) {
        theta = progress * 2 * Math.PI;
      } else {
        theta = (1 - (progress - 0.5) * 2) * Math.PI;
      }
      if (theta === 0) {
        theta = 1e-9;
      }
      const radius = pageWidth.value / theta;
      let radian = 0;
      const dRadian = theta / props.nPolygons;
      let rotate = dRadian / 2 / Math.PI * 180;
      let dRotate = dRadian / Math.PI * 180;
      if (originRight) {
        rotate = -theta / Math.PI * 180 + dRotate / 2;
      }
      if (face === "back") {
        rotate = -rotate;
        dRotate = -dRotate;
      }
      data.minX = Infinity;
      data.maxX = -Infinity;
      return (() => {
        const result = [];
        for (let i = 0, end = props.nPolygons, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
          const bgPos = `${i / (props.nPolygons - 1) * 100}% 0px`;
          const m = pageMatrix.clone();
          const rad = originRight ? theta - radian : radian;
          let x = Math.sin(rad) * radius;
          if (originRight) {
            x = pageWidth.value - x;
          }
          let z = (1 - Math.cos(rad)) * radius;
          if (face === "back") {
            z = -z;
          }
          m.translate3d(x, 0, z);
          m.rotateY(-rotate);
          const x0 = m.transformX(0);
          const x1 = m.transformX(polygonWidth2);
          data.maxX = Math.max(Math.max(x0, x1), data.maxX);
          data.minX = Math.min(Math.min(x0, x1), data.minX);
          const lighting = computeLighting(pageRotation - rotate, dRotate);
          radian += dRadian;
          rotate += dRotate;
          result.push([face + i, image, lighting, bgPos, m.toString(), Math.abs(Math.round(z))]);
        }
        return result;
      })();
    };
    const computeLighting = (rot, dRotate) => {
      const gradients = [];
      const lightingPoints = [-0.5, -0.25, 0, 0.25, 0.5];
      if (props.ambient < 1) {
        const blackness = 1 - props.ambient;
        const diffuse = lightingPoints.map((d) => {
          return (1 - Math.cos((rot - dRotate * d) / 180 * Math.PI)) * blackness;
        });
        gradients.push(`linear-gradient(to right,
    rgba(0, 0, 0, ${diffuse[0]}),
    rgba(0, 0, 0, ${diffuse[1]}) 25%,
    rgba(0, 0, 0, ${diffuse[2]}) 50%,
    rgba(0, 0, 0, ${diffuse[3]}) 75%,
    rgba(0, 0, 0, ${diffuse[4]}))`);
      }
      if (props.gloss > 0) {
        const DEG = 30;
        const POW = 200;
        const specular = lightingPoints.map((d) => {
          return Math.max(Math.pow(Math.cos((rot + DEG - dRotate * d) / 180 * Math.PI), POW), Math.pow(Math.cos((rot - DEG - dRotate * d) / 180 * Math.PI), POW));
        });
        gradients.push(`linear-gradient(to right,
    rgba(255, 255, 255, ${specular[0] * props.gloss}),
    rgba(255, 255, 255, ${specular[1] * props.gloss}) 25%,
    rgba(255, 255, 255, ${specular[2] * props.gloss}) 50%,
    rgba(255, 255, 255, ${specular[3] * props.gloss}) 75%,
    rgba(255, 255, 255, ${specular[4] * props.gloss}))`);
      }
      return gradients.join(",");
    };
    const flipStart = (direction, auto) => {
      if (direction !== props.forwardDirection) {
        if (data.displayedPages === 1) {
          data.flip.frontImage = pageUrl(data.currentPage - 1);
          data.flip.backImage = null;
        } else {
          data.flip.frontImage = pageUrl(data.firstPage);
          data.flip.backImage = pageUrl(data.currentPage - data.displayedPages + 1);
        }
      } else {
        if (data.displayedPages === 1) {
          data.flip.frontImage = pageUrl(data.currentPage);
          data.flip.backImage = null;
        } else {
          data.flip.frontImage = pageUrl(data.secondPage);
          data.flip.backImage = pageUrl(data.currentPage + data.displayedPages);
        }
      }
      data.flip.direction = direction;
      data.flip.progress = 0;
      return requestAnimationFrame(() => {
        return requestAnimationFrame(() => {
          if (data.flip.direction !== props.forwardDirection) {
            if (data.displayedPages === 2) {
              data.firstPage = data.currentPage - data.displayedPages;
            }
          } else {
            if (data.displayedPages === 1) {
              data.firstPage = data.currentPage + data.displayedPages;
            } else {
              data.secondPage = data.currentPage + 1 + data.displayedPages;
            }
          }
          if (auto) {
            return flipAuto(true);
          }
        });
      });
    };
    const flipAuto = (ease) => {
      const t0 = Date.now();
      const duration = props.flipDuration * (1 - data.flip.progress);
      const startRatio = data.flip.progress;
      data.flip.auto = true;
      ctx.emit(`flip-${data.flip.direction}-start`, page.value);
      const animate = () => {
        return requestAnimationFrame(() => {
          const t = Date.now() - t0;
          let ratio = startRatio + t / duration;
          if (ratio > 1) {
            ratio = 1;
          }
          data.flip.progress = ease ? easeInOut(ratio) : ratio;
          if (ratio < 1) {
            return animate();
          } else {
            if (data.flip.direction !== props.forwardDirection) {
              data.currentPage -= data.displayedPages;
            } else {
              data.currentPage += data.displayedPages;
            }
            ctx.emit(`flip-${data.flip.direction}-end`, page.value);
            if (data.displayedPages === 1 && data.flip.direction === props.forwardDirection) {
              data.flip.direction = null;
            } else {
              onImageLoad(1, () => {
                return data.flip.direction = null;
              });
            }
            return data.flip.auto = false;
          }
        });
      };
      return animate();
    };
    const flipRevert = () => {
      const t0 = Date.now();
      const duration = props.flipDuration * data.flip.progress;
      const startRatio = data.flip.progress;
      data.flip.auto = true;
      const animate = () => {
        return requestAnimationFrame(() => {
          const t = Date.now() - t0;
          let ratio = startRatio - startRatio * t / duration;
          if (ratio < 0) {
            ratio = 0;
          }
          data.flip.progress = ratio;
          if (ratio > 0) {
            return animate();
          } else {
            data.firstPage = data.currentPage;
            data.secondPage = data.currentPage + 1;
            if (data.displayedPages === 1 && data.flip.direction !== props.forwardDirection) {
              data.flip.direction = null;
            } else {
              onImageLoad(1, () => {
                return data.flip.direction = null;
              });
            }
            return data.flip.auto = false;
          }
        });
      };
      return animate();
    };
    const onImageLoad = (trigger, cb) => {
      data.nImageLoad = 0;
      data.nImageLoadTrigger = trigger;
      return data.imageLoadCallback = cb;
    };
    const didLoadImage = (ev) => {
      if (data.imageWidth === null) {
        data.imageWidth = ev.target.naturalWidth;
        data.imageHeight = ev.target.naturalHeight;
        preloadImages();
      }
      if (!data.imageLoadCallback) {
        return;
      }
      if (++data.nImageLoad >= data.nImageLoadTrigger) {
        data.imageLoadCallback();
        return data.imageLoadCallback = null;
      }
    };
    const zoomIn = () => {
      if (!canZoomIn.value) {
        return;
      }
      data.zoomIndex += 1;
      return zoomTo(zooms.value[data.zoomIndex]);
    };
    const zoomOut = () => {
      if (!canZoomOut.value) {
        return;
      }
      data.zoomIndex -= 1;
      return zoomTo(zooms.value[data.zoomIndex]);
    };
    const zoomTo = (zoom, fixedX, fixedY) => {
      const start = data.zoom;
      const end = zoom;
      const startX = viewport.value.scrollLeft;
      const startY = viewport.value.scrollTop;
      if (!fixedX) {
        fixedX = viewport.value.clientWidth / 2;
      }
      if (!fixedY) {
        fixedY = viewport.value.clientHeight / 2;
      }
      const containerFixedX = fixedX + startX;
      const containerFixedY = fixedY + startY;
      const endX = containerFixedX / start * end - fixedX;
      const endY = containerFixedY / start * end - fixedY;
      const t0 = Date.now();
      data.zooming = true;
      ctx.emit("zoom-start", zoom);
      const animate = () => {
        return requestAnimationFrame(() => {
          const t = Date.now() - t0;
          let ratio = t / props.zoomDuration;
          if (ratio > 1) {
            ratio = 1;
          }
          ratio = easeInOut(ratio);
          data.zoom = start + (end - start) * ratio;
          data.scrollLeft = startX + (endX - startX) * ratio;
          data.scrollTop = startY + (endY - startY) * ratio;
          if (t < props.zoomDuration) {
            return animate();
          } else {
            ctx.emit("zoom-end", zoom);
            data.zooming = false;
            data.zoom = zoom;
            data.scrollLeft = endX;
            return data.scrollTop = endY;
          }
        });
      };
      animate();
      if (end > 1) {
        return preloadImages(true);
      }
    };
    const zoomAt = (touch) => {
      const rect = viewport.value.getBoundingClientRect();
      const x = touch.pageX - rect.left;
      const y = touch.pageY - rect.top;
      data.zoomIndex = (data.zoomIndex + 1) % zooms.value.length;
      return zoomTo(zooms.value[data.zoomIndex], x, y);
    };
    const swipeStart = (touch) => {
      data.touchStartX = touch.pageX;
      data.touchStartY = touch.pageY;
      data.maxMove = 0;
      if (data.zoom <= 1) {
        if (props.dragToFlip) {
          return data.activeCursor = "grab";
        }
      } else {
        data.startScrollLeft = viewport.value.scrollLeft;
        data.startScrollTop = viewport.value.scrollTop;
        return data.activeCursor = "all-scroll";
      }
    };
    const swipeMove = (touch) => {
      if (data.touchStartX == null || !props.dragToFlip) {
        return;
      }
      const x = touch.pageX - data.touchStartX;
      const y = touch.pageY - data.touchStartY;
      data.maxMove = Math.max(data.maxMove, Math.abs(x));
      data.maxMove = Math.max(data.maxMove, Math.abs(y));
      if (data.zoom > 1) {
        if (dragToScroll.value) {
          dragScroll(x, y);
        }
        return;
      }
      if (Math.abs(y) > Math.abs(x)) {
        return;
      }
      data.activeCursor = "grabbing";
      if (x > 0) {
        if (data.flip.direction === null && canFlipLeft.value && x >= props.swipeMin) {
          flipStart("left", false);
        }
        if (data.flip.direction === "left") {
          data.flip.progress = x / pageWidth.value;
          if (data.flip.progress > 1) {
            data.flip.progress = 1;
          }
        }
      } else {
        if (data.flip.direction === null && canFlipRight.value && x <= -props.swipeMin) {
          flipStart("right", false);
        }
        if (data.flip.direction === "right") {
          data.flip.progress = -x / pageWidth.value;
          if (data.flip.progress > 1) {
            data.flip.progress = 1;
          }
        }
      }
      return true;
    };
    const swipeEnd = (touch) => {
      if (data.touchStartX == null) {
        return;
      }
      if (props.clickToZoom && data.maxMove < props.swipeMin) {
        zoomAt(touch);
      }
      if (data.flip.direction !== null && !data.flip.auto) {
        if (data.flip.progress > 1 / 4) {
          flipAuto(false);
        } else {
          flipRevert();
        }
      }
      data.touchStartX = null;
      return data.activeCursor = null;
    };
    const onTouchStart = (ev) => {
      data.hasTouchEvents = true;
      return swipeStart(ev.changedTouches[0]);
    };
    const onTouchMove = (ev) => {
      if (swipeMove(ev.changedTouches[0])) {
        if (ev.cancelable) {
          return ev.preventDefault();
        }
      }
    };
    const onTouchEnd = (ev) => {
      return swipeEnd(ev.changedTouches[0]);
    };
    const onPointerDown = (ev) => {
      data.hasPointerEvents = true;
      if (data.hasTouchEvents) {
        return;
      }
      if (ev.button && ev.button !== 1) {
        return;
      }
      swipeStart(ev);
      try {
        return ev.target.setPointerCapture(ev.pointerId);
      } catch (error) {
        console.warn("Target element to capture not found");
      }
    };
    const onPointerMove = (ev) => {
      if (!data.hasTouchEvents) {
        return swipeMove(ev);
      }
    };
    const onPointerUp = (ev) => {
      if (data.hasTouchEvents) {
        return;
      }
      swipeEnd(ev);
      try {
        return ev.target.releasePointerCapture(ev.pointerId);
      } catch (error) {
        console.warn("Target element to release capture not found");
      }
    };
    const onMouseDown = (ev) => {
      if (data.hasTouchEvents || data.hasPointerEvents) {
        return;
      }
      if (ev.button && ev.button !== 1) {
        return;
      }
      swipeStart(ev);
    };
    const onMouseMove = (ev) => {
      if (!data.hasTouchEvents && !data.hasPointerEvents) {
        return swipeMove(ev);
      }
    };
    const onMouseUp = (ev) => {
      if (!data.hasTouchEvents && !data.hasPointerEvents) {
        return swipeEnd(ev);
      }
    };
    const dragScroll = (x, y) => {
      data.scrollLeft = data.startScrollLeft - x;
      return data.scrollTop = data.startScrollTop - y;
    };
    const onWheel = (ev) => {
      if (data.zoom > 1 && dragToScroll.value) {
        data.scrollLeft = viewport.value.scrollLeft + ev.deltaX;
        data.scrollTop = viewport.value.scrollTop + ev.deltaY;
        if (ev.cancelable) {
          return ev.preventDefault();
        }
      }
    };
    const preloadImages = (hiRes) => {
      let asc, end, start;
      let i;
      if (hiRes === void 0) {
        hiRes = false;
      }
      for (start = data.currentPage - 3, i = start, end = data.currentPage + 3, asc = start <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
        pageUrlLoading(i);
      }
      if (hiRes) {
        let asc1, end1;
        for (i = data.currentPage, end1 = data.currentPage + data.displayedPages, asc1 = data.currentPage <= end1; asc1 ? i < end1 : i > end1; asc1 ? i++ : i--) {
          const src = props.pagesHiRes[i];
          if (src) {
            new Image().src = src;
          }
        }
      }
    };
    const goToPage = (p) => {
      if (p === null || p === page.value) {
        return;
      }
      if (props.pages[0] === null) {
        if (data.displayedPages === 2 && p === 1) {
          data.currentPage = 0;
        } else {
          data.currentPage = p;
        }
      } else {
        data.currentPage = p - 1;
      }
      data.minX = Infinity;
      data.maxX = -Infinity;
      return data.currentCenterOffset = centerOffset.value;
    };
    const loadImage = (url) => {
      if (data.imageWidth === null) {
        return url;
      } else {
        if (data.loadedImages[url]) {
          return url;
        } else {
          const img = new Image();
          img.onload = () => data.loadedImages[url] = true;
          img.src = url;
          return spinner;
        }
      }
    };
    watch(() => data.currentPage, () => {
      data.firstPage = data.currentPage;
      data.secondPage = data.currentPage + 1;
      return preloadImages();
    });
    watch(centerOffset, () => {
      if (data.animatingCenter) {
        return;
      }
      const animate = () => {
        return requestAnimationFrame(() => {
          const rate = 0.1;
          const diff = centerOffset.value - data.currentCenterOffset;
          if (Math.abs(diff) < 0.5) {
            data.currentCenterOffset = centerOffset.value;
            return data.animatingCenter = false;
          } else {
            data.currentCenterOffset += diff * rate;
            return animate();
          }
        });
      };
      data.animatingCenter = true;
      return animate();
    });
    watch(scrollLeftLimited, (val) => {
      return viewport.value.scrollLeft = val;
    });
    watch(scrollTopLimited, (val) => {
      return viewport.value.scrollTop = val;
    });
    watch(() => props.startPage, (val) => {
      return goToPage(val);
    });
    return {
      ...toRefs(data),
      canFlipLeft,
      canFlipRight,
      canZoomIn,
      canZoomOut,
      page,
      numPages,
      flipLeft,
      flipRight,
      zoomIn,
      zoomOut,
      pageWidth,
      pageHeight,
      xMargin,
      yMargin,
      polygonWidth,
      polygonHeight,
      polygonBgSize,
      polygonArray,
      showLeftPage,
      showRightPage,
      cursor,
      dragToScroll,
      centerOffsetSmoothed,
      boundingLeft,
      boundingRight,
      rightPage,
      leftPage,
      onTouchMove,
      onPointerMove,
      onMouseMove,
      onTouchEnd,
      onPointerUp,
      onMouseUp,
      onWheel,
      loadImage,
      pageUrlLoading,
      didLoadImage,
      onTouchStart,
      onPointerDown,
      onMouseDown,
      viewport
    };
  }
});
const _hoisted_1 = ["src"];
const _hoisted_2 = ["src"];
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", null, [
    renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps({
      canFlipLeft: _ctx.canFlipLeft,
      canFlipRight: _ctx.canFlipRight,
      canZoomIn: _ctx.canZoomIn,
      canZoomOut: _ctx.canZoomOut,
      page: _ctx.page,
      numPages: _ctx.numPages,
      flipLeft: _ctx.flipLeft,
      flipRight: _ctx.flipRight,
      zoomIn: _ctx.zoomIn,
      zoomOut: _ctx.zoomOut
    })), void 0, true),
    createElementVNode("div", {
      ref: "viewport",
      class: normalizeClass(["viewport", {
        zoom: _ctx.zooming || _ctx.zoom > 1,
        "drag-to-scroll": _ctx.dragToScroll
      }]),
      style: normalizeStyle({ cursor: _ctx.cursor === "grabbing" ? "grabbing" : "auto" }),
      onTouchmove: _cache[7] || (_cache[7] = (...args) => _ctx.onTouchMove && _ctx.onTouchMove(...args)),
      onPointermove: _cache[8] || (_cache[8] = (...args) => _ctx.onPointerMove && _ctx.onPointerMove(...args)),
      onMousemove: _cache[9] || (_cache[9] = (...args) => _ctx.onMouseMove && _ctx.onMouseMove(...args)),
      onTouchend: _cache[10] || (_cache[10] = (...args) => _ctx.onTouchEnd && _ctx.onTouchEnd(...args)),
      onTouchcancel: _cache[11] || (_cache[11] = (...args) => _ctx.onTouchEnd && _ctx.onTouchEnd(...args)),
      onPointerup: _cache[12] || (_cache[12] = (...args) => _ctx.onPointerUp && _ctx.onPointerUp(...args)),
      onPointercancel: _cache[13] || (_cache[13] = (...args) => _ctx.onPointerUp && _ctx.onPointerUp(...args)),
      onMouseup: _cache[14] || (_cache[14] = (...args) => _ctx.onMouseUp && _ctx.onMouseUp(...args)),
      onWheel: _cache[15] || (_cache[15] = (...args) => _ctx.onWheel && _ctx.onWheel(...args))
    }, [
      createElementVNode("div", {
        class: "flipbook-container",
        style: normalizeStyle({ transform: `scale(${_ctx.zoom})` })
      }, [
        createElementVNode("div", {
          class: "click-to-flip left",
          style: normalizeStyle({ cursor: _ctx.canFlipLeft ? "pointer" : "auto" }),
          onClick: _cache[0] || (_cache[0] = (...args) => _ctx.flipLeft && _ctx.flipLeft(...args))
        }, null, 4),
        createElementVNode("div", {
          class: "click-to-flip right",
          style: normalizeStyle({ cursor: _ctx.canFlipRight ? "pointer" : "auto" }),
          onClick: _cache[1] || (_cache[1] = (...args) => _ctx.flipRight && _ctx.flipRight(...args))
        }, null, 4),
        createElementVNode("div", {
          style: normalizeStyle({ transform: `translateX(${_ctx.centerOffsetSmoothed}px)` })
        }, [
          _ctx.showLeftPage ? (openBlock(), createElementBlock("img", {
            key: 0,
            class: "page fixed",
            style: normalizeStyle({
              width: _ctx.pageWidth + "px",
              height: _ctx.pageHeight + "px",
              left: _ctx.xMargin + "px",
              top: _ctx.yMargin + "px"
            }),
            src: _ctx.pageUrlLoading(_ctx.leftPage, true),
            onLoad: _cache[2] || (_cache[2] = ($event) => _ctx.didLoadImage($event))
          }, null, 44, _hoisted_1)) : createCommentVNode("", true),
          _ctx.showRightPage ? (openBlock(), createElementBlock("img", {
            key: 1,
            class: "page fixed",
            style: normalizeStyle({
              width: _ctx.pageWidth + "px",
              height: _ctx.pageHeight + "px",
              left: _ctx.viewWidth / 2 + "px",
              top: _ctx.yMargin + "px"
            }),
            src: _ctx.pageUrlLoading(_ctx.rightPage, true),
            onLoad: _cache[3] || (_cache[3] = ($event) => _ctx.didLoadImage($event))
          }, null, 44, _hoisted_2)) : createCommentVNode("", true),
          createElementVNode("div", {
            style: normalizeStyle({ opacity: _ctx.flip.opacity })
          }, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.polygonArray, ([
              key,
              bgImage,
              lighting,
              bgPos,
              transform,
              z
            ]) => {
              return openBlock(), createElementBlock("div", {
                key,
                class: normalizeClass(["polygon", { blank: !bgImage }]),
                style: normalizeStyle({
                  backgroundImage: bgImage && `url(${_ctx.loadImage(bgImage)})`,
                  backgroundSize: _ctx.polygonBgSize,
                  backgroundPosition: bgPos,
                  width: _ctx.polygonWidth,
                  height: _ctx.polygonHeight,
                  transform,
                  zIndex: z
                })
              }, [
                withDirectives(createElementVNode("div", {
                  class: "lighting",
                  style: normalizeStyle({ backgroundImage: lighting })
                }, null, 4), [
                  [vShow, lighting.length]
                ])
              ], 6);
            }), 128))
          ], 4),
          createElementVNode("div", {
            class: "bounding-box",
            style: normalizeStyle({
              left: _ctx.boundingLeft + "px",
              top: _ctx.yMargin + "px",
              width: _ctx.boundingRight - _ctx.boundingLeft + "px",
              height: _ctx.pageHeight + "px",
              cursor: _ctx.cursor
            }),
            onTouchstart: _cache[4] || (_cache[4] = (...args) => _ctx.onTouchStart && _ctx.onTouchStart(...args)),
            onPointerdown: _cache[5] || (_cache[5] = (...args) => _ctx.onPointerDown && _ctx.onPointerDown(...args)),
            onMousedown: _cache[6] || (_cache[6] = (...args) => _ctx.onMouseDown && _ctx.onMouseDown(...args))
          }, null, 36)
        ], 4)
      ], 4)
    ], 38)
  ]);
}
var Flipbook = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-07323c7e"]]);
export { Flipbook as default };
//# sourceMappingURL=flipbook.es.js.map

<template>
  <div>
    <slot
      v-bind="{
        canFlipLeft,
        canFlipRight,
        canZoomIn,
        canZoomOut,
        page,
        numPages,
        flipLeft,
        flipRight,
        zoomIn,
        zoomOut
      }"
    />
    <div
      ref="viewport"
      class="viewport"
      :class="{
        zoom: zooming || zoom > 1,
        'drag-to-scroll': dragToScroll
      }"
      :style="{ cursor: cursor === 'grabbing' ? 'grabbing' : 'auto' }"
      @touchmove="onTouchMove"
      @pointermove="onPointerMove"
      @mousemove="onMouseMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @mouseup="onMouseUp"
      @wheel="onWheel"
    >
      <div
        class="flipbook-container"
        :style="{ transform: `scale(${zoom})` }"
      >
        <div
          class="click-to-flip left"
          :style="{ cursor: canFlipLeft ? 'pointer' : 'auto' }"
          @click="flipLeft"
        />
        <div
          class="click-to-flip right"
          :style="{ cursor: canFlipRight ? 'pointer' : 'auto' }"
          @click="flipRight"
        />
        <div :style="{ transform: `translateX(${centerOffsetSmoothed}px)` }">
          <img
            v-if="showLeftPage"
            class="page fixed"
            :style="{
              width: pageWidth + 'px',
              height: pageHeight + 'px',
              left: xMargin + 'px',
              top: yMargin + 'px'
            }"
            :src="pageUrlLoading(leftPage, true)"
            @load="didLoadImage($event)"
          >
          <img
            v-if="showRightPage"
            class="page fixed"
            :style="{
              width: pageWidth + 'px',
              height: pageHeight + 'px',
              left: viewWidth / 2 + 'px',
              top: yMargin + 'px'
            }"
            :src="pageUrlLoading(rightPage, true)"
            @load="didLoadImage($event)"
          >

          <div :style="{ opacity: flip.opacity }">
            <div
              v-for="[
                key,
                bgImage,
                lighting,
                bgPos,
                transform,
                z
              ] in polygonArray"
              :key="key"
              class="polygon"
              :class="{ blank: !bgImage }"
              :style="{
                backgroundImage: bgImage && `url(${loadImage(bgImage)})`,
                backgroundSize: polygonBgSize,
                backgroundPosition: bgPos,
                width: polygonWidth,
                height: polygonHeight,
                transform: transform,
                zIndex: z,
              }"
            >
              <div
                v-show="lighting.length"
                class="lighting"
                :style="{ backgroundImage: lighting }"
              />
            </div>
          </div>
          <div
            class="bounding-box"
            :style="{
              left: boundingLeft + 'px',
              top: yMargin + 'px',
              width: boundingRight - boundingLeft + 'px',
              height: pageHeight + 'px',
              cursor: cursor
            }"
            @touchstart="onTouchStart"
            @pointerdown="onPointerDown"
            @mousedown="onMouseDown"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, Ref, reactive, ref, computed, PropType, onMounted, onBeforeUnmount, watch, toRefs } from "vue";

import Matrix from "./matrix";
import spinner from "./spinner.svg";

const easeIn = (x: number) => Math.pow(x, 2);
const easeOut = (x: number) => 1 - easeIn(1 - x);
const easeInOut = function(x: number) {
    if (x < 0.5) { return easeIn(x * 2) / 2; } else { return 0.5 + (easeOut((x - 0.5) * 2) / 2); }
};

type Direction = "left"|"right";

export default defineComponent({
    name: "FlipBook",
    props: {
        pages: {
            type: Array as PropType<string[]>,
            required: true,
        },
        pagesHiRes: {
            type: Array as PropType<Array<string>>,
            default(this: void) {
                return [];
            }
        },
        zooms: {
            type: Array as PropType<Array<number>>,
            default: () => [1, 2, 4],
        },
        clickToZoom:{
            type:Boolean,
            default: true,
        },
        dragToFlip:{
            type:Boolean,
            default: true,
        },
        flipDuration: {
            type: Number,
            default: 1000
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
            type: String as PropType<Direction>,
            validator: (val: string) => (val === "right") || (val === "left"),
            default: () => "right",
        },
    },
    emits: ["flip-left-start","flip-left-end","flip-right-start","flip-right-end","zoom-end","zoom-start"],
    setup(props, ctx) {
        const viewport = ref() as Ref<HTMLDivElement>;

        const data = reactive({
            viewWidth: 0,
            viewHeight: 0,
            imageWidth: null as number|null,
            imageHeight: null as number|null,
            displayedPages: 1,
            nImageLoad: 0,
            nImageLoadTrigger: 0,
            imageLoadCallback: null as null | (() => void),
            currentPage: 0,
            firstPage: 0,
            secondPage: 1,
            zoomIndex: 0,
            zoom: 1,
            zooming: false,
            touchStartX: null as number | null,
            touchStartY: null as number | null,
            maxMove: 0,
            activeCursor: null as string | null,
            hasTouchEvents: false,
            hasPointerEvents: false,
            minX: Infinity,
            maxX: -Infinity,
            preloadedImages: {},
            flip: {
                progress: 0,
                direction: null as Direction | null,
                frontImage: null as string | null,
                backImage: null as string | null,
                auto: false,
                opacity: 1
            },
            currentCenterOffset: 0,
            animatingCenter: false,
            startScrollLeft: 0,
            startScrollTop: 0,
            scrollLeft: 0,
            scrollTop: 0,
            loadedImages: {} as { [key: string]: boolean },
        });

        //computed
        const canFlipLeft = computed(() => {
            if (props.forwardDirection === "left") {
                return canGoForward.value;
            } else {
                return canGoBack.value;
            }
        });

        const canFlipRight = computed(() => {
            if (props.forwardDirection === "right") { return canGoForward.value; } else { return canGoBack.value; }
        });

        const canZoomIn = computed(() => { return !data.zooming && (data.zoomIndex < (zooms.value.length - 1)); });

        const canZoomOut = computed(() => { return !data.zooming && (data.zoomIndex > 0); });

        const numPages = computed(() => { if (props.pages[0] === null) { return props.pages.length - 1; } else { return props.pages.length; } });

        const page = computed(() => {
            if (props.pages[0] !== null) {
                return data.currentPage + 1;
            } else {
                return Math.max(1, data.currentPage);
            }
        });

        const zooms = computed(() => { return props.zooms || [1]; });

        const canGoForward = computed(() => {
            return !data.flip.direction && (data.currentPage < (props.pages.length - data.displayedPages));
        });

        const canGoBack = computed(() => {
            return !data.flip.direction && (data.currentPage >= data.displayedPages) &&
          !((data.displayedPages === 1) && !pageUrl(data.firstPage - 1));
        });

        const leftPage = computed(() => {
            if ((props.forwardDirection === "right") || (data.displayedPages === 1)) {
                return data.firstPage;
            } else {
                return data.secondPage;
            }
        });

        const rightPage = computed(() => {
            if (props.forwardDirection === "left") { return data.firstPage; } else { return data.secondPage; }
        });

        const showLeftPage = computed(() => {
            return pageUrl(leftPage.value);
        });

        const showRightPage = computed(() => {
            return pageUrl(rightPage.value) && (data.displayedPages === 2);
        });

        const cursor = computed(() => {
            if (data.activeCursor) {
                return data.activeCursor;
            } else if (props.clickToZoom && canZoomIn.value) {
                return "zoom-in";
            } else if (props.clickToZoom && canZoomOut.value) {
                return "zoom-out";
            } else if(props.dragToFlip) {
                return "grab";
            }
            
            return "auto";
        });

        const pageScale = computed(() => {
            const vw = data.viewWidth / data.displayedPages;
            const xScale = vw / data.imageWidth!;
            const yScale = data.viewHeight / data.imageHeight!;
            const scale = xScale < yScale ? xScale : yScale;
            // return 1;
            if (scale < 1) { return scale; } else { return 1; }
        });

        const pageWidth = computed(() => { return Math.round(data.imageWidth! * pageScale.value); });
        const pageHeight = computed(() => { return Math.round(data.imageHeight! * pageScale.value); });
        const xMargin = computed(() => { return (data.viewWidth - (pageWidth.value * data.displayedPages)) / 2; });
        const yMargin = computed(() => { return (data.viewHeight - pageHeight.value) / 2; });

        const polygonWidth = computed(() => {
            let w = pageWidth.value / props.nPolygons;
            w = Math.ceil(w + (1 / data.zoom));
            return w + "px";
        });

        const polygonHeight = computed(() => { return pageHeight.value + "px"; });
        const polygonBgSize = computed(() => { return `${pageWidth.value}px ${pageHeight.value}px`; });
        const polygonArray = computed(() => {
            return makePolygonArray("front").concat(makePolygonArray("back"));
        });

        const boundingLeft = computed(() => {
            if (data.displayedPages === 1) {
                return xMargin.value;
            } else {
                const x =
            pageUrl(leftPage.value) ?
                xMargin.value
                :
                data.viewWidth / 2;
                if (x < data.minX) { return x; } else { return data.minX; }
            }
        });

        const boundingRight = computed(() => {
            if (data.displayedPages === 1) {
                return data.viewWidth - xMargin.value;
            } else {
                const x =
            pageUrl(rightPage.value) ?
                data.viewWidth - xMargin.value
                :
                data.viewWidth / 2;
                if (x > data.maxX) { return x; } else { return data.maxX; }
            }
        });

        const centerOffset = computed(() => {
            const retval =
          props.centering ?
              Math.round((data.viewWidth / 2) - ((boundingLeft.value + boundingRight.value) / 2))
              :
              0;
            if ((data.currentCenterOffset === null) && (data.imageWidth !== null)) {
                data.currentCenterOffset = retval;
            }
            return retval;
        });

        const centerOffsetSmoothed = computed(() => { return Math.round(data.currentCenterOffset); });
        const dragToScroll = computed(() => { return !data.hasTouchEvents; });

        const scrollLeftMin = computed(() => {
            const w = (boundingRight.value - boundingLeft.value) * data.zoom;
            if (w < data.viewWidth) {
                return ((boundingLeft.value + centerOffsetSmoothed.value) * data.zoom) - ((data.viewWidth - w) / 2);
            } else {
                return (boundingLeft.value + centerOffsetSmoothed.value) * data.zoom;
            }
        });

        const scrollLeftMax = computed(() => {
            const w = (boundingRight.value - boundingLeft.value) * data.zoom;
            if (w < data.viewWidth) {
                return ((boundingLeft.value + centerOffsetSmoothed.value) * data.zoom) - ((data.viewWidth - w) / 2);
            } else {
                return ((boundingRight.value + centerOffsetSmoothed.value) * data.zoom) - data.viewWidth;
            }
        });

        const scrollTopMin = computed(() => {
            const h = pageHeight.value * data.zoom;
            if (h < data.viewHeight) {
                return (yMargin.value * data.zoom) - ((data.viewHeight - h) / 2);
            } else {
                return yMargin.value * data.zoom;
            }
        });

        const scrollTopMax = computed(() => {
            const h = pageHeight.value * data.zoom;
            if (h < data.viewHeight) {
                return (yMargin.value * data.zoom) - ((data.viewHeight - h) / 2);
            } else {
                return ((yMargin.value + pageHeight.value) * data.zoom) - data.viewHeight;
            }
        });

        const scrollLeftLimited = computed(() => {
            return Math.min(scrollLeftMax.value, Math.max(scrollLeftMin.value, data.scrollLeft));
        });

        const scrollTopLimited = computed(() => {
            return Math.min(scrollTopMax.value, Math.max(scrollTopMin.value, data.scrollTop));
        });

        //mounted
        onMounted(() => {
            window.addEventListener("resize", onResize, { passive: true });
            onResize();
            data.zoom = zooms.value[0];
            goToPage(props.startPage);
        });

        //beforeUnmount
        onBeforeUnmount(() => {
            return window.removeEventListener("resize", onResize);
        });

        //methods
        const onResize = () => {
            if (!viewport.value) { return; }
            data.viewWidth = viewport.value.clientWidth;
            data.viewHeight = viewport.value.clientHeight;
            data.displayedPages =
          (data.viewWidth > data.viewHeight) && !props.singlePage ? 2 : 1;
            if (data.displayedPages === 2) { data.currentPage &= ~1; }
            fixFirstPage();
            data.minX = Infinity;
            return data.maxX = -Infinity;
        };

        const fixFirstPage = () => {
            if ((data.displayedPages === 1) &&
          (data.currentPage === 0) &&
          props.pages.length &&
          !pageUrl(0)) { return data.currentPage++; }
        };

        const pageUrl = (page: number, hiRes?: boolean) => {
            if (hiRes === undefined) { hiRes = false; }
            if (hiRes && (data.zoom > 1) && !data.zooming) {
                const url = props.pagesHiRes[page];
                if (url) { return url; }
            }
            return props.pages[page] || null;
        };

        const pageUrlLoading = (page: number, hiRes?: boolean) => {
            if (hiRes === undefined) { hiRes = false; }
            const url = pageUrl(page, hiRes) as string | undefined;
            // High-res image doesn't use 'loading'
            if (hiRes && (data.zoom > 1) && !data.zooming) { return url; }
            return url && loadImage(url);
        };

        const flipLeft = () => {
            if (!canFlipLeft.value) { return; }
            return flipStart("left", true);
        };

        const flipRight = () => {
            if (!canFlipRight.value) { return; }
            return flipStart("right", true);
        };

        const makePolygonArray = (face: string | number): any[] =>  {
            let theta: number;
            if (!data.flip.direction) { return []; }

            let {
                progress
            } = data.flip;
            let {
                direction
            } = data.flip;

            if ((data.displayedPages === 1) && (direction !== props.forwardDirection)) {
                progress = 1 - progress;
                direction = props.forwardDirection;
            }

            data.flip.opacity =
          (data.displayedPages === 1) && (progress > .7) ?
              1 - ((progress - .7) / .3)
              :
              1;

            const image =
          face === "front" ?
              data.flip.frontImage
              :
              data.flip.backImage;

            const polygonWidth = pageWidth.value / props.nPolygons;

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

            const pageMatrix = new Matrix();
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
            if (face === "back") { pageRotation += 180; }

            if (pageRotation) {
                if (originRight) { pageMatrix.translate(pageWidth.value); }
                pageMatrix.rotateY(pageRotation);
                if (originRight) { pageMatrix.translate(-pageWidth.value); }
            }

            if (progress < 0.5) {
                theta = progress * 2 * Math.PI;
            } else {
                theta = (1 - ((progress - 0.5) * 2)) * Math.PI;
            }
            if (theta === 0) {
                theta = 1e-9;
            }
            const radius = pageWidth.value / theta;

            let radian = 0;
            const dRadian = theta / props.nPolygons;
            let rotate = (dRadian / 2 / Math.PI) * 180;
            let dRotate = (dRadian / Math.PI) * 180;

            if (originRight) {
                rotate = ((-theta / Math.PI) * 180) + (dRotate / 2);
            }

            if (face === "back") {
                rotate = -rotate;
                dRotate = -dRotate;
            }

            data.minX = Infinity;
            data.maxX = -Infinity;
            return (() => {
                const result = [] as unknown[];
                for (let i = 0, end = props.nPolygons, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
                    const bgPos = `${(i / (props.nPolygons - 1)) * 100}% 0px`;

                    const m = pageMatrix.clone();
                    const rad = originRight ? theta - radian : radian;
                    let x = Math.sin(rad) * radius;
                    if (originRight) { x = pageWidth.value - x; }
                    let z = (1 - Math.cos(rad)) * radius;
                    if (face === "back") { z = -z; }

                    m.translate3d(x, 0, z);
                    m.rotateY(-rotate);

                    const x0 = m.transformX(0);
                    const x1 = m.transformX(polygonWidth);
                    data.maxX = Math.max(Math.max(x0, x1), data.maxX);
                    data.minX = Math.min(Math.min(x0, x1), data.minX);

                    const lighting = computeLighting(pageRotation - rotate, dRotate);

                    radian += dRadian;
                    rotate += dRotate;
                    result.push([face as number + i, image, lighting, bgPos, m.toString(), Math.abs(Math.round(z))]);
                }
                return result;
            })();
        };

        const computeLighting = (rot: number, dRotate: number) => {
            const gradients = [] as string[];
            const lightingPoints = [-0.5, -0.25, 0, 0.25, 0.5];
            if (props.ambient < 1) {
                const blackness = 1 - props.ambient;
                const diffuse = lightingPoints.map((d: number) => {
                    return (1 - Math.cos(((rot - (dRotate * d)) / 180) * Math.PI)) * blackness;
                });
                gradients.push(`\
linear-gradient(to right,
    rgba(0, 0, 0, ${diffuse[0]}),
    rgba(0, 0, 0, ${diffuse[1]}) 25%,
    rgba(0, 0, 0, ${diffuse[2]}) 50%,
    rgba(0, 0, 0, ${diffuse[3]}) 75%,
    rgba(0, 0, 0, ${diffuse[4]}))\
`
                );
            }

            if ((props.gloss > 0)) {
                const DEG = 30;
                const POW = 200;
                const specular = lightingPoints.map((d: number) => {
                    return Math.max(
                        Math.pow(Math.cos((((rot + DEG) - (dRotate * d)) / 180) * Math.PI), POW),
                        Math.pow(Math.cos(((rot - DEG - (dRotate * d)) / 180) * Math.PI), POW)
                    );
                });
                gradients.push(`\
linear-gradient(to right,
    rgba(255, 255, 255, ${specular[0] * props.gloss}),
    rgba(255, 255, 255, ${specular[1] * props.gloss}) 25%,
    rgba(255, 255, 255, ${specular[2] * props.gloss}) 50%,
    rgba(255, 255, 255, ${specular[3] * props.gloss}) 75%,
    rgba(255, 255, 255, ${specular[4] * props.gloss}))\
`
                );
            }
            return gradients.join(",");
        };

        const flipStart = (direction: Direction, auto: boolean) => {
            if (direction !== props.forwardDirection) {
                if (data.displayedPages === 1) {
                    data.flip.frontImage = pageUrl(data.currentPage - 1);
                    data.flip.backImage = null;
                } else {
                    data.flip.frontImage = pageUrl(data.firstPage);
                    data.flip.backImage = pageUrl((data.currentPage - data.displayedPages) + 1);
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
                    if (auto) { return flipAuto(true); }
                });
            });
        };

        const flipAuto = (ease: boolean) => {
            const t0 = Date.now();
            const duration = props.flipDuration * (1 - data.flip.progress);
            const startRatio = data.flip.progress;
            data.flip.auto = true;
            ctx.emit(`flip-${data.flip.direction!}-start`, page.value);
            const animate = (): number => {
                return requestAnimationFrame(() => {
                    const t = Date.now() - t0;
                    let ratio = startRatio + (t / duration);
                    if (ratio > 1) { ratio = 1; }
                    data.flip.progress = ease ? easeInOut(ratio) : ratio;
                    if (ratio < 1) {
                        return animate();
                    } else {
                        if (data.flip.direction !== props.forwardDirection) {
                            data.currentPage -= data.displayedPages;
                        } else {
                            data.currentPage += data.displayedPages;
                        }
                        ctx.emit(`flip-${data.flip.direction!}-end`, page.value);
                        if ((data.displayedPages === 1) && (data.flip.direction === props.forwardDirection)) {
                            data.flip.direction = null;
                        } else {
                            onImageLoad(1, () => { return data.flip.direction = null; });
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
            const animate = (): number => {
                return requestAnimationFrame(() => {
                    const t = Date.now() - t0;
                    let ratio = startRatio - ((startRatio * t) / duration);
                    if (ratio < 0) { ratio = 0; }
                    data.flip.progress = ratio;
                    if (ratio > 0) {
                        return animate();
                    } else {
                        data.firstPage = data.currentPage;
                        data.secondPage = data.currentPage + 1;
                        if ((data.displayedPages === 1) && (data.flip.direction !== props.forwardDirection)) {
                            data.flip.direction = null;
                        } else {
                            onImageLoad(1, () => { return data.flip.direction = null; });
                        }
                        return data.flip.auto = false;
                    }
                });
            };
            return animate();
        };

        const onImageLoad = (trigger: number, cb: () => void) => {
            data.nImageLoad = 0;
            data.nImageLoadTrigger = trigger;
            return data.imageLoadCallback = cb;
        };

        const didLoadImage = (ev: Event) => {
            // debugger;
            if (data.imageWidth === null) {
                data.imageWidth = (ev.target as HTMLImageElement).naturalWidth;
                data.imageHeight = (ev.target as HTMLImageElement).naturalHeight;
                preloadImages();
            }
            if (!data.imageLoadCallback) { return; }
            if (++data.nImageLoad >= data.nImageLoadTrigger) {
                data.imageLoadCallback();
                return data.imageLoadCallback = null;
            }
        };

        const zoomIn = () => {
            if (!canZoomIn.value) { return; }
            data.zoomIndex += 1;
            return zoomTo(zooms.value[data.zoomIndex]);
        };

        const zoomOut = () => {
            if (!canZoomOut.value) { return; }
            data.zoomIndex -= 1;
            return zoomTo(zooms.value[data.zoomIndex]);
        };

        const zoomTo = (zoom: number, fixedX?: number, fixedY?: number) => {
            const start = data.zoom;
            const end = zoom;

            const startX = viewport.value.scrollLeft;
            const startY = viewport.value.scrollTop;
            if (!fixedX) { fixedX = viewport.value.clientWidth / 2; }
            if (!fixedY) { fixedY = viewport.value.clientHeight / 2; }
            const containerFixedX = fixedX + startX;
            const containerFixedY = fixedY + startY;
            const endX = ((containerFixedX / start) * end) - fixedX;
            const endY = ((containerFixedY / start) * end) - fixedY;

            const t0 = Date.now();
            data.zooming = true;
            ctx.emit("zoom-start", zoom);
            const animate = (): number => {
                return requestAnimationFrame(() => {
                    const t = Date.now() - t0;
                    let ratio = t / props.zoomDuration;
                    if (ratio > 1) { ratio = 1; }
                    ratio = easeInOut(ratio);
                    data.zoom = start + ((end - start) * ratio);
                    data.scrollLeft = startX + ((endX - startX) * ratio);
                    data.scrollTop = startY + ((endY - startY) * ratio);
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

        const zoomAt = (touch: { pageX: number; pageY: number; }) => {
            const rect = viewport.value.getBoundingClientRect();
            const x = touch.pageX - rect.left;
            const y = touch.pageY - rect.top;
            data.zoomIndex = (data.zoomIndex + 1) % zooms.value.length;
            return zoomTo(zooms.value[data.zoomIndex], x, y);
        };

        const swipeStart = (touch: { pageX: number; pageY: number; }) => {
            data.touchStartX = touch.pageX;
            data.touchStartY = touch.pageY;
            data.maxMove = 0;
            if (data.zoom <= 1 ) {
                if(props.dragToFlip){
                    return data.activeCursor = "grab";
                }
            } else {
                data.startScrollLeft = viewport.value.scrollLeft;
                data.startScrollTop = viewport.value.scrollTop;
                return data.activeCursor = "all-scroll";
            }
        };

        const swipeMove = (touch: MouseEvent | Touch) => {
            if (data.touchStartX == null || !props.dragToFlip ) { return; }
            const x = touch.pageX - data.touchStartX;
            const y = touch.pageY - data.touchStartY!;
            data.maxMove = Math.max(data.maxMove, Math.abs(x));
            data.maxMove = Math.max(data.maxMove, Math.abs(y));
            if (data.zoom > 1) {
                if (dragToScroll.value) { dragScroll(x, y); }
                return;
            }
            if (Math.abs(y) > Math.abs(x)) { return; }
            data.activeCursor = "grabbing";
            if (x > 0) {
                if ((data.flip.direction === null) && canFlipLeft.value && (x >= props.swipeMin)) {
                    flipStart("left", false);
                }
                if (data.flip.direction === "left") {
                    data.flip.progress = x / pageWidth.value;
                    if (data.flip.progress > 1) { data.flip.progress = 1; }
                }
            } else {
                if ((data.flip.direction === null) && canFlipRight.value && (x <= -props.swipeMin)) {
                    flipStart("right", false);
                }
                if (data.flip.direction === "right") {
                    data.flip.progress = -x / pageWidth.value;
                    if (data.flip.progress > 1) { data.flip.progress = 1; }
                }
            }
            return true;
        };

        const swipeEnd = (touch: any) => {
            if (data.touchStartX == null) { return; }
            if (props.clickToZoom && data.maxMove < props.swipeMin) { zoomAt(touch); }
            if ((data.flip.direction !== null) && !data.flip.auto) {
                if (data.flip.progress > (1 / 4)) {
                    flipAuto(false);
                } else {
                    flipRevert();
                }
            }
            data.touchStartX = null;
            return data.activeCursor = null;
        };

        const onTouchStart = (ev: TouchEvent) => {
            data.hasTouchEvents = true;
            return swipeStart(ev.changedTouches[0]);
        };

        const onTouchMove = (ev: TouchEvent) => {
            if (swipeMove(ev.changedTouches[0])) {
                if (ev.cancelable) { return ev.preventDefault(); }
            }
        };

        const onTouchEnd = (ev: TouchEvent) => { return swipeEnd(ev.changedTouches[0]); };

        const onPointerDown = (ev: PointerEvent) => {
            data.hasPointerEvents = true;
            if (data.hasTouchEvents) { return; }
            if (ev.button && (ev.button !== 1)) { return; } // Ignore right-click
            swipeStart(ev);
            try {
                return (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
            } catch (error) {
                console.warn("Target element to capture not found");
            }
        };

        const onPointerMove = (ev: MouseEvent) => { if (!data.hasTouchEvents) { return swipeMove(ev); } };

        const onPointerUp = (ev: PointerEvent) => {
            if (data.hasTouchEvents) { return; }
            swipeEnd(ev);
            try {
                return (ev.target as HTMLElement).releasePointerCapture(ev.pointerId);
            } catch (error) { 
                console.warn("Target element to release capture not found");
            }
        };

        const onMouseDown = (ev: MouseEvent) => {
            if (data.hasTouchEvents || data.hasPointerEvents) { return; }
            if (ev.button && (ev.button !== 1)) { return; } // Ignore right-click
            swipeStart(ev);
        };

        const onMouseMove = (ev: MouseEvent) => {
            if (!data.hasTouchEvents && !data.hasPointerEvents) { return swipeMove(ev); }
        };

        const onMouseUp = (ev: MouseEvent) => {
            if (!data.hasTouchEvents && !data.hasPointerEvents) { return swipeEnd(ev); }
        };

        const dragScroll = (x: number, y: number) => {
            data.scrollLeft = data.startScrollLeft - x;
            return data.scrollTop = data.startScrollTop - y;
        };

        const onWheel = (ev: WheelEvent) => {
            if ((data.zoom > 1) && dragToScroll.value) {
                data.scrollLeft = viewport.value.scrollLeft + ev.deltaX;
                data.scrollTop = viewport.value.scrollTop + ev.deltaY;
                if (ev.cancelable) { return ev.preventDefault(); }
            }
        };

        const preloadImages = (hiRes?: boolean) => {
            let asc: boolean, end: number, start: number;
            let i: number;
            if (hiRes === undefined) { hiRes = false; }
            for (start = data.currentPage - 3, i = start, end = data.currentPage + 3, asc = start <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
                pageUrlLoading(i);
            } // this preloads image
            if (hiRes) {
                let asc1: boolean, end1: number;
                for (i = data.currentPage, end1 = data.currentPage + data.displayedPages, asc1 = data.currentPage <= end1; asc1 ? i < end1 : i > end1; asc1 ? i++ : i--) {
                    const src = props.pagesHiRes[i];
                    if (src) {
                        (new Image).src = src;
                    }
                }
            }
        };

        const goToPage = (p: number) => {
            if ((p === null) || (p === page.value)) { return; }
            if (props.pages[0] === null) {
                if ((data.displayedPages === 2) && (p === 1)) {
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

        const loadImage = (url: string) => {
            if (data.imageWidth === null) {
                // First loaded image defines the image width and height.
                // So it must be true image, not 'loading' image.
                return url;
            } else {
                if (data.loadedImages[url]) {
                    return url;
                } else {
                    const img = new Image;
                    img.onload = () => data.loadedImages[url] = true;
                    img.src = url;
                    return spinner;
                }
            }
        };

        //watch
        watch(() => data.currentPage, () => {
            data.firstPage = data.currentPage;
            data.secondPage = data.currentPage + 1;
            return preloadImages();
        });

        watch(centerOffset, () => {
            if (data.animatingCenter) { return; }
            const animate = (): number => {
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

        // watch(props.pages, (after, before) => {
        //     fixFirstPage();
        //     if (!(before != null ? before.length : undefined) && (after != null ? after.length : undefined)) {
        //         if ((props.startPage > 1) && (after[0] === null)) {
        //             return data.currentPage++;
        //         }
        //     }
        // });

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
            viewport,
        };
    }
});
</script>

<style scoped>
.viewport {
  -webkit-overflow-scrolling: touch;
  width: 100%;
  height: 100%;
}

.viewport.zoom {
  overflow: scroll;
}

.viewport.zoom.drag-to-scroll {
  overflow: hidden;
}

.flipbook-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: top left;
  user-select: none;
}

.click-to-flip {
  position: absolute;
  width: 50%;
  height: 100%;
  top: 0;
  user-select: none;
}

.click-to-flip.left {
  left: 0;
}

.click-to-flip.right {
  right: 0;
}

.bounding-box {
  position: absolute;
  user-select: none;
}

.page {
  position: absolute;
  backface-visibility: hidden;
}

.polygon {
  position: absolute;
  top: 0;
  left: 0;
  background-repeat: no-repeat;
  backface-visibility: hidden;
  transform-origin: center left;
}

.polygon.blank {
  background-color: #ddd;
}

.polygon .lighting {
  width: 100%;
  height: 100%;
}
</style>

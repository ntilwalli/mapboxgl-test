"use strict";
var rxjs_1 = require("rxjs");
var rxjs_run_1 = require("@cycle/rxjs-run");
var dom_1 = require("@cycle/dom");
var main_1 = require("../main");
function between(first, second) {
    return function (source) { return first.switchMap(function () {
        return source.takeUntil(second);
    }); };
}
function toGeoJSON(lngLat) {
    return {
        type: "FeatureCollection",
        features: [{
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [lngLat.lng, lngLat.lat]
                },
                properties: {
                    title: "Some location",
                    icon: "marker"
                }
            }]
    };
}
function main(sources) {
    var marker = { lng: -74.5, lat: 40 };
    var mapSources = {
        marker: {
            type: "geojson",
            data: toGeoJSON(marker)
        }
    };
    var layers = {
        marker: {
            id: "marker",
            //type: `symbol`,
            type: "circle",
            source: "marker",
            paint: {
                "circle-color": "#FF0000",
                "circle-radius": 10
            }
        }
    };
    var anchorId = "mapdiv";
    var descriptor = {
        controls: {},
        map: {
            container: anchorId,
            style: "mapbox://styles/mapbox/bright-v9",
            center: [-74.50, 40],
            zoom: 9,
            dragPan: true
        },
        sources: mapSources,
        layers: layers,
        canvas: {
            style: {
                cursor: "grab"
            }
        },
        options: {
            offset: [100, 100]
        }
    };
    // const mapClick$ = sources.MapJSON.select(anchorId).events(`click`).observable
    //    .map(ev => {
    //      return ev.lngLat
    //    })
    //    .publish().refCount()
    // const mapAccessor = sources.MapJSON.select(anchorId)
    // const mouseDown$ = mapAccessor.events(`mousedown`)
    //   .queryRenderedFilter({
    //     layers: [`venue`]
    //   })
    //   .filter(x => x && x.length)
    //   //.do(x => console.log(`mouseDown$`, x))
    //   .publish().refCount()
    // const mouseMove$ = mapAccessor.events(`mousemove`).observable
    // const mouseUp$ = mapAccessor.events(`mouseup`).observable
    //     //.do(x => console.log(`mouseup$`, x))
    //     .publish().refCount()
    // const markerMove$ = mouseMove$.let(between(mouseDown$, mouseUp$))
    //   .map(ev => ev.lngLat)
    //   .publish().refCount()
    // const mapClick$ = mapAccessor.events(`click`).observable
    // return {
    //   DOM: markerMove$
    //    .map(x => JSON.stringify(x))
    //    .startWith(`blah`)
    //    .map(x => div([
    //       div(`#${anchorId}`, []),
    //       div([x])
    //     ])),
    //   MapJSON: O.merge(markerMove$
    //     .map(x => {
    //       descriptor.sources.venue.data = toGeoJSON(x)
    //       return JSON.parse(JSON.stringify(descriptor))
    //     })
    //     .startWith(JSON.parse(JSON.stringify(descriptor))),
    //     // mouseDown$.map(() => {
    //     //   descriptor.map.dragPan = false
    //     //   return JSON.parse(JSON.stringify(descriptor))
    //     // }),
    //     // mouseUp$.map(() => {
    //     //   descriptor.map.dragPan = true
    //     //   return JSON.parse(JSON.stringify(descriptor))
    //     // }),
    //     mapClick$.map(ev => {
    //       mapSources.venue.data = toGeoJSON(ev.lngLat)
    //       descriptor.sources = mapSources
    //       descriptor.layers = layers
    //       return JSON.parse(JSON.stringify(descriptor))
    //     })
    //   )
    // }
    var mapAccessor = sources.MapJSON.select(anchorId);
    var mouseDown$ = mapAccessor.events("mousedown")
        .queryRenderedFilter({
        layers: ["marker"]
    })
        .filter(function (x) { return x && x.length; })
        .publish().refCount();
    var mouseMoveObj = mapAccessor.events("mousemove");
    var mouseMove$ = mouseMoveObj.observable
        .publish().refCount();
    var markerHover$ = mouseMoveObj
        .queryRenderedFilter({
        layers: ["marker"]
    })
        .map(function (x) { return !!(x && x.length); })
        .distinctUntilChanged()
        .publish().refCount();
    var mouseUp$ = mapAccessor.events("mouseup").observable
        .publish().refCount();
    var markerMove$ = mouseMove$.let(between(mouseDown$, mouseUp$))
        .map(function (ev) { return ev.lngLat; })
        .publish().refCount();
    var state$ = rxjs_1.Observable.merge(markerMove$.map(function (x) { return function (state) {
        state.lngLat = x;
        return state;
    }; }), markerHover$.map(function (x) { return function (state) {
        state.hover = x;
        return state;
    }; }))
        .startWith({ lngLat: marker, hover: false })
        .scan(function (acc, f) { return f(acc); });
    return {
        DOM: markerMove$
            .map(function (x) { return JSON.stringify(x); })
            .startWith("blah")
            .map(function (x) { return dom_1.div([
            dom_1.div("#" + anchorId, []),
            dom_1.div([x])
        ]); }),
        MapJSON: state$.map(function (_a) {
            var lngLat = _a.lngLat, hover = _a.hover;
            descriptor.map.dragPan = hover ? false : true;
            descriptor.sources.marker.data = toGeoJSON(lngLat);
            descriptor.canvas.style.cursor = hover ? "move" : "pointer";
            return JSON.parse(JSON.stringify(descriptor));
        })
    };
}
rxjs_run_1.default.run(main, {
    DOM: dom_1.makeDOMDriver("#app"),
    MapJSON: main_1.makeMapJSONDriver("pk.eyJ1IjoibXJyZWRlYXJzIiwiYSI6ImNpbHJsZnJ3NzA4dHZ1bGtub2hnbGVnbHkifQ.ph2UH9MoZtkVB0_RNBOXwA")
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsNkJBQW9DO0FBQ3BDLDRDQUFtQztBQUNuQyxrQ0FBNkM7QUFDN0MsZ0NBQXlDO0FBR3pDLGlCQUFpQixLQUFLLEVBQUUsTUFBTTtJQUM1QixNQUFNLENBQUMsVUFBQyxNQUFNLElBQUssT0FBQSxLQUFLLENBQUMsU0FBUyxDQUFDO1FBQ2pDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ2pDLENBQUMsQ0FBQyxFQUZpQixDQUVqQixDQUFBO0FBQ0osQ0FBQztBQUNELG1CQUFtQixNQUFNO0lBQ3ZCLE1BQU0sQ0FBQztRQUNILElBQUksRUFBRSxtQkFBbUI7UUFDekIsUUFBUSxFQUFFLENBQUM7Z0JBQ1AsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsUUFBUSxFQUFFO29CQUNOLElBQUksRUFBRSxPQUFPO29CQUNiLFdBQVcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQztpQkFDeEM7Z0JBQ0QsVUFBVSxFQUFFO29CQUNWLEtBQUssRUFBRSxlQUFlO29CQUN0QixJQUFJLEVBQUUsUUFBUTtpQkFDZjthQUNKLENBQUM7S0FDTCxDQUFBO0FBQ0gsQ0FBQztBQUVELGNBQWMsT0FBTztJQUVuQixJQUFNLE1BQU0sR0FBRyxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFDLENBQUE7SUFDcEMsSUFBTSxVQUFVLEdBQUc7UUFDakIsTUFBTSxFQUFFO1lBQ04sSUFBSSxFQUFFLFNBQVM7WUFDZixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQztTQUN4QjtLQUNGLENBQUE7SUFFRCxJQUFNLE1BQU0sR0FBRztRQUNiLE1BQU0sRUFBRTtZQUNOLEVBQUUsRUFBRSxRQUFRO1lBQ1osaUJBQWlCO1lB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R0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsU0FBRyxDQUFDO1lBQ1gsU0FBRyxDQUFDLE1BQUksUUFBVSxFQUFFLEVBQUUsQ0FBQztZQUN2QixTQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNULENBQUMsRUFITyxDQUdQLENBQUM7UUFDTCxPQUFPLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFDLEVBQWU7Z0JBQWQsa0JBQU0sRUFBRSxnQkFBSztZQUNqQyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQTtZQUM3QyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ2xELFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLEdBQUcsTUFBTSxHQUFHLFNBQVMsQ0FBQTtZQUMzRCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUE7UUFDL0MsQ0FBQyxDQUFDO0tBQ0gsQ0FBQTtBQU1ILENBQUM7QUFFRCxrQkFBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUU7SUFDZCxHQUFHLEVBQUUsbUJBQWEsQ0FBQyxNQUFNLENBQUM7SUFDMUIsT0FBTyxFQUFFLHdCQUFpQixDQUN4Qiw4RkFBOEYsQ0FDL0Y7Q0FDRixDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge09ic2VydmFibGUgYXMgT30gZnJvbSAncnhqcydcbmltcG9ydCBDeWNsZSBmcm9tICdAY3ljbGUvcnhqcy1ydW4nXG5pbXBvcnQge21ha2VET01Ecml2ZXIsIGRpdn0gZnJvbSAnQGN5Y2xlL2RvbSdcbmltcG9ydCB7bWFrZU1hcEpTT05Ecml2ZXJ9IGZyb20gJy4uL21haW4nXG5cblxuZnVuY3Rpb24gYmV0d2VlbihmaXJzdCwgc2Vjb25kKSB7XG4gIHJldHVybiAoc291cmNlKSA9PiBmaXJzdC5zd2l0Y2hNYXAoKCkgPT4ge1xuICAgIHJldHVybiBzb3VyY2UudGFrZVVudGlsKHNlY29uZClcbiAgfSlcbn1cbmZ1bmN0aW9uIHRvR2VvSlNPTihsbmdMYXQpIHtcbiAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiRmVhdHVyZUNvbGxlY3Rpb25cIixcbiAgICAgIGZlYXR1cmVzOiBbe1xuICAgICAgICAgIHR5cGU6IFwiRmVhdHVyZVwiLFxuICAgICAgICAgIGdlb21ldHJ5OiB7XG4gICAgICAgICAgICAgIHR5cGU6IFwiUG9pbnRcIixcbiAgICAgICAgICAgICAgY29vcmRpbmF0ZXM6IFtsbmdMYXQubG5nLCBsbmdMYXQubGF0XVxuICAgICAgICAgIH0sXG4gICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgdGl0bGU6IFwiU29tZSBsb2NhdGlvblwiLFxuICAgICAgICAgICAgaWNvbjogXCJtYXJrZXJcIlxuICAgICAgICAgIH1cbiAgICAgIH1dXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFpbihzb3VyY2VzKSB7XG5cbiAgY29uc3QgbWFya2VyID0ge2xuZzogLTc0LjUsIGxhdDogNDB9XG4gIGNvbnN0IG1hcFNvdXJjZXMgPSB7XG4gICAgbWFya2VyOiB7XG4gICAgICB0eXBlOiBgZ2VvanNvbmAsXG4gICAgICBkYXRhOiB0b0dlb0pTT04obWFya2VyKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGxheWVycyA9IHtcbiAgICBtYXJrZXI6IHtcbiAgICAgIGlkOiBgbWFya2VyYCxcbiAgICAgIC8vdHlwZTogYHN5bWJvbGAsXG4gICAgICB0eXBlOiBgY2lyY2xlYCxcbiAgICAgIHNvdXJjZTogYG1hcmtlcmAsXG4gICAgICBwYWludDoge1xuICAgICAgICBcImNpcmNsZS1jb2xvclwiOiBcIiNGRjAwMDBcIixcbiAgICAgICAgXCJjaXJjbGUtcmFkaXVzXCI6IDEwXG4gICAgICB9XG4gICAgICAvLyBsYXlvdXQ6IHtcbiAgICAgIC8vICAgICBcImljb24taW1hZ2VcIjogYHtpY29ufS0xNWAsXG4gICAgICAvLyAgICAgXCJpY29uLXNpemVcIjogMS41LFxuICAgICAgLy8gICAgIC8vXCJ0ZXh0LWZpZWxkXCI6IGB7dGl0bGV9YCxcbiAgICAgIC8vICAgICBcInRleHQtZm9udFwiOiBbYE9wZW4gU2FucyBTZW1pYm9sZGAsIGBBcmlhbCBVbmljb2RlIE1TIEJvbGRgXSxcbiAgICAgIC8vICAgICBcInRleHQtb2Zmc2V0XCI6IFswLCAwLjZdLFxuICAgICAgLy8gICAgIFwidGV4dC1hbmNob3JcIjogYHRvcGBcbiAgICAgIC8vIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBhbmNob3JJZCA9IGBtYXBkaXZgXG4gIGNvbnN0IGRlc2NyaXB0b3IgPSB7XG4gICAgY29udHJvbHM6IHt9LFxuICAgIG1hcDoge1xuICAgICAgY29udGFpbmVyOiBhbmNob3JJZCwgXG4gICAgICBzdHlsZTogYG1hcGJveDovL3N0eWxlcy9tYXBib3gvYnJpZ2h0LXY5YCwgLy9zdHlsZXNoZWV0IGxvY2F0aW9uXG4gICAgICBjZW50ZXI6IFstNzQuNTAsIDQwXSwgLy8gc3RhcnRpbmcgcG9zaXRpb25cbiAgICAgIHpvb206IDksIC8vIHN0YXJ0aW5nIHpvb20sXG4gICAgICBkcmFnUGFuOiB0cnVlXG4gICAgfSxcbiAgICBzb3VyY2VzOiBtYXBTb3VyY2VzLFxuICAgIGxheWVycyxcbiAgICBjYW52YXM6IHtcbiAgICAgIHN0eWxlOiB7XG4gICAgICAgIGN1cnNvcjogYGdyYWJgXG4gICAgICB9XG4gICAgfSxcbiAgICBvcHRpb25zOiB7XG4gICAgICBvZmZzZXQ6IFsxMDAsIDEwMF1cbiAgICB9XG4gIH1cblxuICAvLyBjb25zdCBtYXBDbGljayQgPSBzb3VyY2VzLk1hcEpTT04uc2VsZWN0KGFuY2hvcklkKS5ldmVudHMoYGNsaWNrYCkub2JzZXJ2YWJsZVxuICAvLyAgICAubWFwKGV2ID0+IHtcbiAgLy8gICAgICByZXR1cm4gZXYubG5nTGF0XG4gIC8vICAgIH0pXG4gIC8vICAgIC5wdWJsaXNoKCkucmVmQ291bnQoKVxuXG4gIC8vIGNvbnN0IG1hcEFjY2Vzc29yID0gc291cmNlcy5NYXBKU09OLnNlbGVjdChhbmNob3JJZClcbiAgLy8gY29uc3QgbW91c2VEb3duJCA9IG1hcEFjY2Vzc29yLmV2ZW50cyhgbW91c2Vkb3duYClcbiAgLy8gICAucXVlcnlSZW5kZXJlZEZpbHRlcih7XG4gIC8vICAgICBsYXllcnM6IFtgdmVudWVgXVxuICAvLyAgIH0pXG4gIC8vICAgLmZpbHRlcih4ID0+IHggJiYgeC5sZW5ndGgpXG4gIC8vICAgLy8uZG8oeCA9PiBjb25zb2xlLmxvZyhgbW91c2VEb3duJGAsIHgpKVxuICAvLyAgIC5wdWJsaXNoKCkucmVmQ291bnQoKVxuXG4gIC8vIGNvbnN0IG1vdXNlTW92ZSQgPSBtYXBBY2Nlc3Nvci5ldmVudHMoYG1vdXNlbW92ZWApLm9ic2VydmFibGVcbiAgLy8gY29uc3QgbW91c2VVcCQgPSBtYXBBY2Nlc3Nvci5ldmVudHMoYG1vdXNldXBgKS5vYnNlcnZhYmxlXG4gIC8vICAgICAvLy5kbyh4ID0+IGNvbnNvbGUubG9nKGBtb3VzZXVwJGAsIHgpKVxuICAvLyAgICAgLnB1Ymxpc2goKS5yZWZDb3VudCgpXG4gIC8vIGNvbnN0IG1hcmtlck1vdmUkID0gbW91c2VNb3ZlJC5sZXQoYmV0d2Vlbihtb3VzZURvd24kLCBtb3VzZVVwJCkpXG4gIC8vICAgLm1hcChldiA9PiBldi5sbmdMYXQpXG4gIC8vICAgLnB1Ymxpc2goKS5yZWZDb3VudCgpXG5cbiAgLy8gY29uc3QgbWFwQ2xpY2skID0gbWFwQWNjZXNzb3IuZXZlbnRzKGBjbGlja2ApLm9ic2VydmFibGVcblxuICAvLyByZXR1cm4ge1xuICAvLyAgIERPTTogbWFya2VyTW92ZSRcbiAgLy8gICAgLm1hcCh4ID0+IEpTT04uc3RyaW5naWZ5KHgpKVxuICAvLyAgICAuc3RhcnRXaXRoKGBibGFoYClcbiAgLy8gICAgLm1hcCh4ID0+IGRpdihbXG4gIC8vICAgICAgIGRpdihgIyR7YW5jaG9ySWR9YCwgW10pLFxuICAvLyAgICAgICBkaXYoW3hdKVxuICAvLyAgICAgXSkpLFxuICAvLyAgIE1hcEpTT046IE8ubWVyZ2UobWFya2VyTW92ZSRcbiAgLy8gICAgIC5tYXAoeCA9PiB7XG4gIC8vICAgICAgIGRlc2NyaXB0b3Iuc291cmNlcy52ZW51ZS5kYXRhID0gdG9HZW9KU09OKHgpXG4gIC8vICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGRlc2NyaXB0b3IpKVxuICAvLyAgICAgfSlcbiAgLy8gICAgIC5zdGFydFdpdGgoSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkZXNjcmlwdG9yKSkpLFxuICAvLyAgICAgLy8gbW91c2VEb3duJC5tYXAoKCkgPT4ge1xuICAvLyAgICAgLy8gICBkZXNjcmlwdG9yLm1hcC5kcmFnUGFuID0gZmFsc2VcbiAgLy8gICAgIC8vICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGVzY3JpcHRvcikpXG4gIC8vICAgICAvLyB9KSxcbiAgLy8gICAgIC8vIG1vdXNlVXAkLm1hcCgoKSA9PiB7XG4gIC8vICAgICAvLyAgIGRlc2NyaXB0b3IubWFwLmRyYWdQYW4gPSB0cnVlXG4gIC8vICAgICAvLyAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGRlc2NyaXB0b3IpKVxuICAvLyAgICAgLy8gfSksXG4gIC8vICAgICBtYXBDbGljayQubWFwKGV2ID0+IHtcbiAgLy8gICAgICAgbWFwU291cmNlcy52ZW51ZS5kYXRhID0gdG9HZW9KU09OKGV2LmxuZ0xhdClcbiAgLy8gICAgICAgZGVzY3JpcHRvci5zb3VyY2VzID0gbWFwU291cmNlc1xuICAvLyAgICAgICBkZXNjcmlwdG9yLmxheWVycyA9IGxheWVyc1xuICAvLyAgICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkZXNjcmlwdG9yKSlcbiAgLy8gICAgIH0pXG4gIC8vICAgKVxuICAvLyB9XG5cblxuICBjb25zdCBtYXBBY2Nlc3NvciA9IHNvdXJjZXMuTWFwSlNPTi5zZWxlY3QoYW5jaG9ySWQpXG4gIGNvbnN0IG1vdXNlRG93biQgPSBtYXBBY2Nlc3Nvci5ldmVudHMoYG1vdXNlZG93bmApXG4gICAgLnF1ZXJ5UmVuZGVyZWRGaWx0ZXIoe1xuICAgICAgbGF5ZXJzOiBbYG1hcmtlcmBdXG4gICAgfSlcbiAgICAuZmlsdGVyKHggPT4geCAmJiB4Lmxlbmd0aClcbiAgICAucHVibGlzaCgpLnJlZkNvdW50KClcblxuICBjb25zdCBtb3VzZU1vdmVPYmogPSBtYXBBY2Nlc3Nvci5ldmVudHMoYG1vdXNlbW92ZWApXG4gIGNvbnN0IG1vdXNlTW92ZSQgPSBtb3VzZU1vdmVPYmoub2JzZXJ2YWJsZVxuICAgIC5wdWJsaXNoKCkucmVmQ291bnQoKVxuXG4gIGNvbnN0IG1hcmtlckhvdmVyJCA9IG1vdXNlTW92ZU9ialxuICAgIC5xdWVyeVJlbmRlcmVkRmlsdGVyKHtcbiAgICAgIGxheWVyczogW2BtYXJrZXJgXVxuICAgIH0pXG4gICAgLm1hcCh4ID0+ICEhKHggJiYgeC5sZW5ndGgpKVxuICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpXG4gICAgLnB1Ymxpc2goKS5yZWZDb3VudCgpXG5cbiAgY29uc3QgbW91c2VVcCQgPSBtYXBBY2Nlc3Nvci5ldmVudHMoYG1vdXNldXBgKS5vYnNlcnZhYmxlXG4gICAgLnB1Ymxpc2goKS5yZWZDb3VudCgpXG4gIGNvbnN0IG1hcmtlck1vdmUkID0gbW91c2VNb3ZlJC5sZXQoYmV0d2Vlbihtb3VzZURvd24kLCBtb3VzZVVwJCkpXG4gICAgLm1hcChldiA9PiBldi5sbmdMYXQpXG4gICAgLnB1Ymxpc2goKS5yZWZDb3VudCgpXG5cbiAgY29uc3Qgc3RhdGUkID0gTy5tZXJnZShcbiAgICBtYXJrZXJNb3ZlJC5tYXAoeCA9PiBzdGF0ZSA9PiB7XG4gICAgICBzdGF0ZS5sbmdMYXQgPSB4XG4gICAgICByZXR1cm4gc3RhdGVcbiAgICB9KSxcbiAgICBtYXJrZXJIb3ZlciQubWFwKHggPT4gc3RhdGUgPT4ge1xuICAgICAgc3RhdGUuaG92ZXIgPSB4XG4gICAgICByZXR1cm4gc3RhdGVcbiAgICB9KVxuICApXG4gIC5zdGFydFdpdGgoe2xuZ0xhdDogbWFya2VyLCBob3ZlcjogZmFsc2V9KVxuICAuc2NhbigoYWNjLCBmOiBGdW5jdGlvbikgPT4gZihhY2MpKVxuXG5cbiAgcmV0dXJuIHtcbiAgICBET006IG1hcmtlck1vdmUkXG4gICAgIC5tYXAoeCA9PiBKU09OLnN0cmluZ2lmeSh4KSlcbiAgICAgLnN0YXJ0V2l0aChgYmxhaGApXG4gICAgIC5tYXAoeCA9PiBkaXYoW1xuICAgICAgICBkaXYoYCMke2FuY2hvcklkfWAsIFtdKSxcbiAgICAgICAgZGl2KFt4XSlcbiAgICAgIF0pKSxcbiAgICBNYXBKU09OOiBzdGF0ZSQubWFwKCh7bG5nTGF0LCBob3Zlcn0pID0+IHtcbiAgICAgIGRlc2NyaXB0b3IubWFwLmRyYWdQYW4gPSBob3ZlciA/IGZhbHNlIDogdHJ1ZVxuICAgICAgZGVzY3JpcHRvci5zb3VyY2VzLm1hcmtlci5kYXRhID0gdG9HZW9KU09OKGxuZ0xhdClcbiAgICAgIGRlc2NyaXB0b3IuY2FudmFzLnN0eWxlLmN1cnNvciA9IGhvdmVyID8gYG1vdmVgIDogYHBvaW50ZXJgXG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkZXNjcmlwdG9yKSlcbiAgICB9KVxuICB9XG5cblxuXG5cblxufVxuXG5DeWNsZS5ydW4obWFpbiwge1xuICBET006IG1ha2VET01Ecml2ZXIoYCNhcHBgKSxcbiAgTWFwSlNPTjogbWFrZU1hcEpTT05Ecml2ZXIoXG4gICAgYHBrLmV5SjFJam9pYlhKeVpXUmxZWEp6SWl3aVlTSTZJbU5wYkhKc1puSjNOekE0ZEhaMWJHdHViMmhuYkdWbmJIa2lmUS5waDJVSDlNb1p0a1ZCMF9STkJPWHdBYFxuICApXG59KSJdfQ==
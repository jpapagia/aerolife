function createGauge(containerId, value, pollutant) {
    const root = am5.Root.new(containerId);

    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
        am5radar.RadarChart.new(root, {
            panX: false,
            panY: false,
            startAngle: 180,
            endAngle: 360,
        })
    );

    const axisRenderer = am5radar.AxisRendererCircular.new(root, {
        innerRadius: -40,
    });

    const pollutantRanges = getThresholdsForPollutant(pollutant);

    if (!pollutantRanges || pollutantRanges.length === 0) {
        console.error(`No thresholds defined for pollutant: ${pollutant}`);
        return;
    }

    const maxValue = pollutantRanges[pollutantRanges.length - 1]?.high || 400;

    const xAxis = chart.xAxes.push(
        am5xy.ValueAxis.new(root, {
            maxDeviation: 0,
            min: 0,
            max: maxValue,
            strictMinMax: true,
            renderer: axisRenderer,
        })
    );

    const axisDataItem = xAxis.makeDataItem({});

    const clockHand = am5radar.ClockHand.new(root, {
        pinRadius: am5.percent(20),
        radius: am5.percent(90),
        bottomWidth: 10,
    });

    const bullet = axisDataItem.set(
        "bullet",
        am5xy.AxisBullet.new(root, {
            sprite: clockHand,
        })
    );

    xAxis.createAxisRange(axisDataItem);

    axisDataItem.set("value", value);

    pollutantRanges.forEach((data) => {
        const axisRange = xAxis.createAxisRange(
            xAxis.makeDataItem({
                value: data.low,
                endValue: data.high,
            })
        );

        axisRange.get("axisFill").setAll({
            visible: true,
            fill: am5.color(data.color),
            fillOpacity: 0.8,
        });
    });
}



function getThresholdsForPollutant(pollutant) {
    const thresholds = {
        co: [
            { title: "Good", color: "#54b947", low: 0, high: 4400 },
            { title: "Fair", color: "#b0d136", low: 4400, high: 9400 },
            { title: "Moderate", color: "#fdae19", low: 9400, high: 12400 },
            { title: "Poor", color: "#f04922", low: 12400, high: 15400 },
            { title: "Very Poor", color: "#ee1f25", low: 15400, high: 20000 }
        ],
        no: [
            { title: "Good", color: "#54b947", low: 0, high: 40 },
            { title: "Fair", color: "#b0d136", low: 40, high: 70 },
            { title: "Moderate", color: "#fdae19", low: 70, high: 150 },
            { title: "Poor", color: "#f04922", low: 150, high: 200 },
            { title: "Very Poor", color: "#ee1f25", low: 200, high: 300 }
        ],
        no2: [
            { title: "Good", color: "#54b947", low: 0, high: 40 },
            { title: "Fair", color: "#b0d136", low: 40, high: 70 },
            { title: "Moderate", color: "#fdae19", low: 70, high: 150 },
            { title: "Poor", color: "#f04922", low: 150, high: 200 },
            { title: "Very Poor", color: "#ee1f25", low: 200, high: 300 }
        ],
        o3: [
            { title: "Good", color: "#54b947", low: 0, high: 60 },
            { title: "Fair", color: "#b0d136", low: 60, high: 100 },
            { title: "Moderate", color: "#fdae19", low: 100, high: 140 },
            { title: "Poor", color: "#f04922", low: 140, high: 180 },
            { title: "Very Poor", color: "#ee1f25", low: 180, high: 300 }
        ],
        so2: [
            { title: "Good", color: "#54b947", low: 0, high: 20 },
            { title: "Fair", color: "#b0d136", low: 20, high: 80 },
            { title: "Moderate", color: "#fdae19", low: 80, high: 250 },
            { title: "Poor", color: "#f04922", low: 250, high: 350 },
            { title: "Very Poor", color: "#ee1f25", low: 350, high: 400 }
        ],
        pm2_5: [
            { title: "Good", color: "#54b947", low: 0, high: 10 },
            { title: "Fair", color: "#b0d136", low: 10, high: 25 },
            { title: "Moderate", color: "#fdae19", low: 25, high: 50 },
            { title: "Poor", color: "#f04922", low: 50, high: 75 },
            { title: "Very Poor", color: "#ee1f25", low: 75, high: 100 }
        ],
        pm10: [
            { title: "Good", color: "#54b947", low: 0, high: 20 },
            { title: "Fair", color: "#b0d136", low: 20, high: 50 },
            { title: "Moderate", color: "#fdae19", low: 50, high: 100 },
            { title: "Poor", color: "#f04922", low: 100, high: 200 },
            { title: "Very Poor", color: "#ee1f25", low: 200, high: 300 }
        ],
        nh3: [
            { title: "Good", color: "#54b947", low: 0, high: 200 },
            { title: "Fair", color: "#b0d136", low: 200, high: 400 },
            { title: "Moderate", color: "#fdae19", low: 400, high: 800 },
            { title: "Poor", color: "#f04922", low: 800, high: 1200 },
            { title: "Very Poor", color: "#ee1f25", low: 1200, high: 2000 }
        ]
    };
    return thresholds[pollutant] || [];
}


function getFullName(pollutant) {
    const names = {
        co: "Carbon Monoxide",
        no: "Nitrogen Monoxide",
        no2: "Nitrogen Dioxide",
        o3: "Ozone",
        so2: "Sulphur Dioxide",
        pm2_5: "Particulates (PM2.5)",
        pm10: "Particulates (PM10)",
        nh3: "Ammonia"
    };
    return names[pollutant] || pollutant;
}


window.createGauge = createGauge;

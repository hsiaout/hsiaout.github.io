window.Apex = {
  chart: {
    foreColor: "#ccc",
    toolbar: {
      show: false,
    },
  },
  stroke: {
    width: 3,
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    theme: "dark",
  },
  grid: {
    borderColor: "#535A6C",
    xaxis: {
      lines: {
        show: true,
      },
    },
  },
};

var spark1 = {
  chart: {
    id: "spark1",
    group: "sparks",
    type: "line",
    // height: 80,
    height: "100%",
    sparkline: {
      enabled: true,
    },
    dropShadow: {
      enabled: true,
      top: 1,
      left: 1,
      blur: 2,
      opacity: 0.5,
    },
  },
  series: [
    {
      data: [25, 66, 41, 59, 25, 44, 12, 36, 9, 21],
    },
  ],
  stroke: {
    curve: "smooth",
  },
  markers: {
    size: 0,
  },
  grid: {
    padding: {
      top: 20,
      bottom: 10,
      left: 110,
    },
  },
  colors: ["#fff"],
  tooltip: {
    x: {
      show: false,
    },
    y: {
      title: {
        formatter: function formatter(val) {
          return "";
        },
      },
    },
  },
};

var spark2 = {
  chart: {
    id: "spark2",
    group: "sparks",
    type: "line",
    // height: 80,
    height: "100%",
    sparkline: {
      enabled: true,
    },
    dropShadow: {
      enabled: true,
      top: 1,
      left: 1,
      blur: 2,
      opacity: 0.5,
    },
  },
  series: [
    {
      data: [12, 14, 2, 47, 32, 44, 14, 55, 41, 69],
    },
  ],
  stroke: {
    curve: "smooth",
  },
  grid: {
    padding: {
      top: 20,
      bottom: 10,
      left: 110,
    },
  },
  markers: {
    size: 0,
  },
  colors: ["#fff"],
  tooltip: {
    x: {
      show: false,
    },
    y: {
      title: {
        formatter: function formatter(val) {
          return "";
        },
      },
    },
  },
};

var spark3 = {
  chart: {
    id: "spark3",
    group: "sparks",
    type: "line",
    // height: 80,
    height: "100%",
    sparkline: {
      enabled: true,
    },
    dropShadow: {
      enabled: true,
      top: 1,
      left: 1,
      blur: 2,
      opacity: 0.5,
    },
  },
  series: [
    {
      data: [47, 45, 74, 32, 56, 31, 44, 33, 45, 19],
    },
  ],
  stroke: {
    curve: "smooth",
  },
  markers: {
    size: 0,
  },
  grid: {
    padding: {
      top: 20,
      bottom: 10,
      left: 110,
    },
  },
  colors: ["#fff"],
  xaxis: {
    crosshairs: {
      width: 1,
    },
  },
  tooltip: {
    x: {
      show: false,
    },
    y: {
      title: {
        formatter: function formatter(val) {
          return "";
        },
      },
    },
  },
};

var spark4 = {
  chart: {
    id: "spark4",
    group: "sparks",
    type: "line",
    // height: 80,
    height: "100%",
    sparkline: {
      enabled: true,
    },
    dropShadow: {
      enabled: true,
      top: 1,
      left: 1,
      blur: 2,
      opacity: 0.5,
    },
  },
  series: [
    {
      data: [15, 75, 47, 65, 14, 32, 19, 54, 44, 61],
    },
  ],
  stroke: {
    curve: "smooth",
  },
  markers: {
    size: 0,
  },
  grid: {
    padding: {
      top: 20,
      bottom: 10,
      left: 110,
    },
  },
  colors: ["#fff"],
  xaxis: {
    crosshairs: {
      width: 1,
    },
  },
  tooltip: {
    x: {
      show: false,
    },
    y: {
      title: {
        formatter: function formatter(val) {
          return "";
        },
      },
    },
  },
};

// new ApexCharts(document.querySelector("#pane1"), spark1).render();
// new ApexCharts(document.querySelector("#pane2"), spark2).render();
// new ApexCharts(document.querySelector("#pane3"), spark3).render();
// new ApexCharts(document.querySelector("#pane4"), spark4).render();

var optionsLine = {
  chart: {
    // height: 328,
    height: "100%",
    type: "line",
    zoom: {
      enabled: false,
    },
    dropShadow: {
      enabled: true,
      top: 3,
      left: 2,
      blur: 4,
      opacity: 1,
    },
  },
  stroke: {
    curve: "smooth",
    width: 2,
  },
  //colors: ["#3F51B5", '#2196F3'],
  series: [
    {
      name: "資料一",
      data: [1, 15, 26, 20, 33, 27],
    },
    {
      name: "資料二",
      data: [3, 33, 21, 42, 19, 32],
    },
    {
      name: "資料三",
      data: [0, 39, 52, 11, 29, 43],
    },
  ],
  title: {
    text: "線條圖",
    align: "left",
    offsetY: 25,
    offsetX: 20,
  },
  subtitle: {
    text: "統計值",
    offsetY: 55,
    offsetX: 20,
  },
  markers: {
    size: 6,
    strokeWidth: 0,
    hover: {
      size: 9,
    },
  },
  grid: {
    show: true,
    padding: {
      bottom: 0,
    },
  },
  labels: [
    "01/15/2002",
    "01/16/2002",
    "01/17/2002",
    "01/18/2002",
    "01/19/2002",
    "01/20/2002",
  ],
  xaxis: {
    tooltip: {
      enabled: false,
    },
  },
  legend: {
    position: "top",
    horizontalAlign: "right",
    offsetY: -20,
  },
};

var optionsCircle4 = {
  chart: {
    type: "radialBar",
    // height: 350,
    height: "100%",
    width: "100%",
  },
  plotOptions: {
    radialBar: {
      size: undefined,
      inverseOrder: true,
      hollow: {
        margin: 5,
        size: "48%",
        background: "transparent",
      },
      track: {
        show: false,
      },
      startAngle: -180,
      endAngle: 180,
    },
  },
  stroke: {
    lineCap: "round",
  },
  series: [71, 63, 77],
  labels: ["六月", "五月", "四月"],
  legend: {
    show: true,
    floating: true,
    position: "right",
    offsetX: 70,
    offsetY: 230,
  },
};

var optionsBar = {
  chart: {
    // height: 380,
    height: "100%",
    type: "bar",
    stacked: true,
  },
  plotOptions: {
    bar: {
      columnWidth: "30%",
      horizontal: false,
    },
  },
  series: [
    {
      name: "產品A",
      data: [14, 25, 21, 17, 12, 13, 11, 19],
    },
    {
      name: "產品B",
      data: [13, 23, 20, 8, 13, 27, 33, 12],
    },
    {
      name: "產品C",
      data: [11, 17, 15, 15, 21, 14, 15, 13],
    },
  ],
  xaxis: {
    categories: [
      "2011 第一季",
      "2011 第二季",
      "2011 第三季",
      "2011 第四季",
      "2012 第一季",
      "2012 第二季",
      "2012 第三季",
      "2012 第四季",
    ],
  },
  fill: {
    opacity: 1,
  },
};

var optionsArea = {
  chart: {
    // height: 380,
    height: "100%",
    type: "area",
    stacked: false,
  },
  stroke: {
    curve: "straight",
  },
  series: [
    {
      name: "資料一",
      data: [11, 15, 26, 20, 33, 27],
    },
    {
      name: "資料二",
      data: [32, 33, 21, 42, 19, 32],
    },
    {
      name: "資料三",
      data: [20, 39, 52, 11, 29, 43],
    },
  ],
  xaxis: {
    categories: [
      "2011 第一季",
      "2011 第二季",
      "2011 第三季",
      "2011 第四季",
      "2012 第一季",
      "2012 第二季",
    ],
  },
  tooltip: {
    followCursor: true,
  },
  fill: {
    opacity: 1,
  },
};

setTimeout(() => {
	var pane1 = new ApexCharts(document.querySelector("#pane1"), optionsLine);
	pane1.render();

	var pane2 = new ApexCharts(document.querySelector("#pane2"), optionsArea);
	pane2.render();
	
	var pane3 = new ApexCharts(document.querySelector("#pane3"), optionsBar);
	pane3.render();
	
	// var pane4 = new ApexCharts(document.querySelector("#pane4"),optionsArea);
	// pane4.render();

	// var pane5 = new ApexCharts(document.querySelector("#pane5"), optionsLine);
	// pane5.render();
	
	// var pane6 = new ApexCharts(document.querySelector("#pane6"), optionsCircle4);
	// pane6.render();

	// var pane7 = new ApexCharts(document.querySelector("#pane7"), optionsBar);
	// pane7.render();

	// var pane8 = new ApexCharts(document.querySelector("#pane8"),optionsArea);
	// pane8.render();

	// var pane9 = new ApexCharts(document.querySelector("#pane9"), optionsLine);
  	// pane9.render();

}, 1000);

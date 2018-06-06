import _ from 'lodash';
// global moment

export default function(_data, _trades, _height, _indicators) {

  const trades = _trades.map(t => {
    return {
      price: t.price,
      date: moment.utc(t.date).toDate(),
      action: t.action
    }
  });

  const data = _data.map(c => {
    return {
      price: c.close,
      date: moment.utc(c.start).toDate()
    }
  });
  var indicatorRange = [];
  const indicators = _.map(_indicators, (value, key) => {
    console.log('indicators map:', key, value);
    return value.map(data => {
      indicatorRange.push(Number(data.value));
      return {
        value: data.value,
        date: moment.utc(data.date).toDate()
      }
    });
  });

  var dates = data.map(c => +c.date);
  var prices = data.map(c => +c.price);
  console.log('PRices', prices);
  console.log('Indicators range', indicatorRange);


  var svg = d3.select("#chart");

  svg.attr("width", window.innerWidth - 20);

  var margin = {top: 20, right: 20, bottom: 300, left: 40};
  // var margin = {top: 20, right: 20, bottom: 110, left: 40};
  var height = _height - margin.top - margin.bottom;
  console.log('height:', height);
  var width = +svg.attr("width") - margin.left - margin.right;
  var brushMargin = {top: _height - 70, right: 20, bottom: 30, left: 40};
  console.log('brushMargin:', brushMargin);
  var brushHeight = _height - brushMargin.top - brushMargin.bottom;
  console.log('height2:', brushHeight);
  var indicatorMargin = {top: _height - 250, right: 20, bottom: 70, left: 40};
  console.log('indicatorMargin:', indicatorMargin);
  var indicatorHeight = _height - indicatorMargin.top - indicatorMargin.bottom;
  console.log('indicatorHeight:', indicatorHeight);
  var x = d3.scaleUtc().range([0, width]),
      x2 = d3.scaleUtc().range([0, width]),
      indicatorX = d3.scaleUtc().range([0, width]),
      y = d3.scaleLinear().range([height, 0]),
      y2 = d3.scaleLinear().range([brushHeight, 0]),
      indicatorY = d3.scaleLinear().range([indicatorHeight, 0]);

  var xAxis = d3.axisBottom(x),
      xAxis2 = d3.axisBottom(x2),
      indicatorXAxis = d3.axisBottom(indicatorX),
      indicatorYAxis = d3.axisLeft(indicatorY).ticks(_height / 50),
      yAxis = d3.axisLeft(y).ticks(_height / 50);

  var brush = d3.brushX()
      .extent([[0, 0], [width, brushHeight]])
      .on("brush end", brushed);

  var zoom = d3.zoom()
      .scaleExtent([1, 100])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on("zoom", zoomed);

  var line = d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.price); });

  var line2 = d3.line()
      .x(function(d) { return x2(d.date); })
      .y(function(d) { return y2(d.price); });

  var indicatorLine = d3.line()
      .x(function(d) { return indicatorX(d.date); })
      .y(function(d) { return indicatorY(d.value); });

  svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", width)
      .attr("height", height);

  var focus = svg.append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = svg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + brushMargin.left + "," + brushMargin.top + ")");

  var indicator = svg.append("g")
    .attr("class", "indicator")
    .attr("transform", "translate(" + indicatorMargin.left + "," + indicatorMargin.top + ")");

  var indicatorPanel = indicator.append("rect")
    .attr("class", "indicatorPanel")
    .attr("width", width)
    .attr("height", indicatorHeight)
  .attr("fill", 'transparent');
   //.attr("transform", "translate(" + indicatorMargin.left + "," + indicatorMargin.top + ")");

  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain([
    d3.min(prices) * 0.99,
    d3.max(prices) * 1.01
  ]);
  x2.domain(x.domain());
  y2.domain(y.domain());

  indicatorX.domain(x.domain());

  console.log("Damn Range", indicatorRange);
  var indicatorMax =  Math.abs(d3.max(indicatorRange));
  var indicatorMin =  Math.abs(d3.min(indicatorRange));
  console.log('indicatorMax',indicatorMax);
  console.log('indicatorMin',indicatorMin);
  var indicatorAbsMax = (indicatorMax > indicatorMin)
    ? indicatorMax * 1.1 : indicatorMin * 1.1;

  console.log('Absolute max:',indicatorAbsMax);

  indicatorY.domain([
    -indicatorAbsMax,
    indicatorAbsMax
  ]);

  console.log('range', indicatorRange);
  console.log('range min', d3.min(indicatorRange));
  console.log('range max', d3.max(indicatorRange));

  focus.append("path")
      .datum(data)
      .attr("class", "line price")
      .attr("d", line);

  focus.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  focus.append("g")
      .attr("class", "axis axis--y")
      .call(yAxis);
  console.log('indicators^^', indicators);
  var indicatorKeys = [];
  _.forEach(indicators, (v, k) => {
    var name = "indicator-0" + k;
    console.log(k, ':', v);
    console.log('indicator line', indicatorLine);
    indicatorKeys.push(name);
    indicator.append("path")
      .datum(v)
      .attr("class", "line " + name)
      .attr("d", indicatorLine);
  });

  indicator.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + indicatorHeight + ")")
      .call(indicatorXAxis);

  indicator.append("g")
      .attr("class", "axis axis--y")
      .call(indicatorYAxis);

  var verticalLine = indicator.append("line")
    .attr("opacity", 0)
    .attr("y1", 0)
    .attr("y2", indicatorHeight)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("pointer-events", "none");

  var verticalReference = focus.append("line")
    .attr("opacity", 0)
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("pointer-events", "none");

  var horizontalLine = indicator.append("line")
    .attr("opacity", 0)
    .attr("x1", 0)
    .attr("x2", width)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("pointer-events", "none");

  indicator.on("mousemove", function(){
    var mouse = d3.mouse(this),
        mousex = mouse[0],
        mousey = mouse[1];
    verticalLine.attr("x1", mousex).attr("x2", mousex).attr("opacity", 1);
    horizontalLine.attr("y1", mousey).attr("y2", mousey).attr("opacity", 1)
    verticalReference.attr("x1", mousex).attr("x2", mousex).attr("opacity", 1);
  }).on("mouseout", function(){
    verticalLine.attr("opacity", 0);
    horizontalLine.attr("opacity", 0);
    verticalReference.attr("opacity", 0);
  });

  context.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line2);

  context.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line2);

  context.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + brushHeight + ")")
      .call(xAxis2);

  var circles = svg
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .selectAll("circle")
      .data(trades)
      .enter().append("circle")
        .attr('class', function(d) { return d.action })
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(d.price); })
        .attr('r', 5);

  var brushCircles = context
    .append('g')
    // .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .selectAll("circle")
      .data(trades)
      .enter().append("circle")
        .attr('class', function(d) { return d.action })
        .attr("cx", function(d) { return x2(d.date); })
        .attr("cy", function(d) { return y2(d.price); })
        .attr('r', 3);


  context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());

  svg.append("rect")
      .attr("class", "zoom")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(zoom);

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || x2.range();
    x.domain(s.map(x2.invert, x2));

    scaleY(x.domain());

    svg.select(".axis--y")
      .call(yAxis);

    circles
      .attr("cx", function(d) { return x(d.date); })
      .attr("cy", function(d) { return y(d.price); })

    focus.select(".line").attr("d", line);
    focus.select(".axis--x").call(xAxis);
    svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
        .scale(width / (s[1] - s[0]))
        .translate(-s[0], 0));
  }

  function scaleY(domain) {
    let [min, max] = domain;

    let minIndex = _.sortedIndex(dates, min);
    let maxIndex = _.sortedIndex(dates, max);

    let set = prices.slice(minIndex, maxIndex);
    y.domain([
      d3.min(set) * 0.9995,
      d3.max(set) * 1.0005
    ]);
  }

  function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    var t = d3.event.transform;

    scaleY(t.rescaleX(x2).domain());    

    svg.select(".axis--y")
      .call(yAxis);

    indicatorX.domain(t.rescaleX(x2).domain());

    indicatorKeys.forEach((v, k) => {
      indicator.select("." + v).attr("d", indicatorLine);
    });


    x.domain(t.rescaleX(x2).domain());
    focus.select(".line").attr("d", line);

    circles
      .attr("cx", function(d) { return x(d.date); })
      .attr("cy", function(d) { return y(d.price); })


    indicator.select(".axis--x").call(indicatorXAxis);
    focus.select(".axis--x").call(xAxis);
    context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
  }
}
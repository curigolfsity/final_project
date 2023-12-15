function displayWeather(data) {
    // Display the weather information
    var resultElement = document.getElementById('weatherResult');
    resultElement.innerHTML = `<h1 class="text-2xl font-bold mb-4">Weather Forecast for ${data.location.name}, ${data.location.country}</h1>`;

    // Display forecast for each day
    data.forecast.forecastday.forEach(day => {
        const dayBox = document.createElement('div');
        dayBox.classList.add('bg-gray-200', 'p-4', 'rounded-xl', 'mb-4');

        dayBox.innerHTML = `
        <div class="relative">
        <img class="absolute top-0 right-0" src="${day.day.condition.icon}" alt="${day.day.condition.text} icon">
            <h3 class="text-lg font-semibold">${formatDate(day.date)}</h3>
            <p><strong>Condition:</strong> ${day.day.condition.text}</p>
            <p><strong>Temperature:</strong> ${day.day.avgtemp_c}°C</p>
            <p><strong>PM 2.5:</strong> ${Math.round(day.day.air_quality.pm2_5 * 100) / 100}</p>
            <p><strong>Average Humidity:</strong> ${day.day.avghumidity}</p>
            </div>
        `;

        resultElement.appendChild(dayBox);
    });
}

let weatherData; // Declare weatherData globally

// Initially hide the buttons
document.getElementById('temperatureBtn').style.display = 'none';
document.getElementById('humidityBtn').style.display = 'none';

document.getElementById('weatherForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    // Get the user's input
    var location = document.getElementById('location').value;

    // Call the weather API
    await fetch(`http://api.weatherapi.com/v1/forecast.json?key=50a12659b1ad4a809a140619231212&q=${location}&days=10&aqi=yes&alerts=no`)
        .then(response => response.json())
        .then(data => {
            // Process the API response and display the result
            document.getElementById('chart-container').style.display = 'inline';
            weatherData = data; // Store the weather data globally
            displayWeather(data);
            visualizeDataTemp(data);

            // Show the buttons after fetching weather data
            document.getElementById('temperatureBtn').style.display = 'inline';
            document.getElementById('humidityBtn').style.display = 'inline';
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            document.getElementById('weatherResult').innerHTML = 'Error fetching weather data. Please try again.';
        });
});

document.getElementById('temperatureBtn').addEventListener('click', function () {
    if (weatherData) {
        visualizeDataTemp(weatherData);
    } else {
        alert('Please fetch weather data first');
    }
});

document.getElementById('humidityBtn').addEventListener('click', function () {
    if (weatherData) {
        visualizeDataHumid(weatherData);
    } else {
        alert('Please fetch weather data first');
    }
});

// for temperature

function visualizeDataTemp(data) {
    // Visualize data with D3.js
    const chartdata = data.forecast.forecastday.map(day => ({ x: formatDate(day.date), y: day.day.avgtemp_c }));

    const margin = { top: 20, right: 70, bottom: 40, left: 70 }; // Adjusted margin for better fitting
;
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
        // Select the existing chart container
    const chartContainer = d3.select('.chart-container');

    // Remove any existing SVG to prevent duplicate charts
    chartContainer.select('svg').remove();
    // Create SVG element
    const svg = chartContainer
        .append('svg')
        .attr('id', 'line-chart')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(chartdata.map(d => d.x))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([d3.min(chartdata, d => d.y)-5, d3.max(chartdata, d => d.y)+5])
        .range([height, 0]);

    const line = d3.line()
        .x(d => xScale(d.x) + xScale.bandwidth() / 2) // Adjusted x position for the center of each band
        .y(d => yScale(d.y))
        .curve(d3.curveLinear);

    svg.append('path')
        .data([chartdata])  // Use an array to represent a single data point
        .attr('class', 'line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#CB4335');

    svg.selectAll('.dot')
        .data(chartdata)
        .enter().append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.x) + xScale.bandwidth() / 2) // Adjusted x position for the center of each band
        .attr('cy', d => yScale(d.y))
        .attr('r', 5)
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut); // Radius of the dot

    //x-axis
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 5)
        .attr('dy', '1.5em')
        .style('text-anchor', 'middle')
        .text('Date');

    //y-axis
    const yAxisGroup = svg.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yScale));


    const yAxisLabel = svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left ) // Adjust the distance from the y-axis here
    .attr('x', -height / 2)
    .attr('dy', '1.5em')
    .style('text-anchor', 'middle')
    .text('Temperature (°C)');

// Adjust the position of the y-axis tick text
    yAxisGroup.selectAll('text')
    .attr('x', -5)  // Adjust this value as needed
    .style('text-anchor', 'end');  // Adjust this value as needed


// Tooltip
    const tooltip = chartContainer.append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    const weatherInfo = d3.select('#weatherInfo');

    svg.selectAll('.dot')
        .data(chartdata)
        .enter().append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.x) + xScale.bandwidth() / 2)
        .attr('cy', d => yScale(d.y))
        .attr('r', 5)
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);


    function handleMouseOver(event, d) {
        d3.select(this).attr('r', 8);
    
        tooltip.transition().duration(200).style('opacity', 0.9);
    
        const chartContainerRect = chartContainer.node().getBoundingClientRect();
    
        // Calculate the x and y positions for the tooltip
        const xPosition = xScale(d.x) + xScale.bandwidth() / 2 + chartContainerRect.left;
        const yPosition = yScale(d.y) + chartContainerRect.top;
    
        // Center-align the tooltip horizontally
        const tooltipWidth = parseFloat(tooltip.style('width'));
        const xOffset = tooltipWidth / 2;
    
        tooltip.style('left', xPosition - xOffset + 'px');
    
        // Check if the tooltip goes beyond the top of the chart
        if (yPosition - tooltip.node().offsetHeight < chartContainerRect.top) {
            tooltip.style('top', yPosition + 'px'); // Display below the point
        } else {
            tooltip.style('top', yPosition - tooltip.node().offsetHeight - 10 + 'px'); // Display above the point
        }
    
        // Display weather information underneath the graph
        const dayIndex = chartdata.findIndex(item => item.x === d.x);
        const dayWeather = data.forecast.forecastday[dayIndex].day;
        
        const weatherInfo = d3.select('#weatherInfo');
        weatherInfo.html(`
        <div class="weather-info">
            <h3 class="text-xl">${formatDate(d.x)}</h3>
            <p><strong>Condition:</strong> ${dayWeather.condition.text}</p>
            <p><strong>Temperature:</strong> ${dayWeather.avgtemp_c}°C</p>
            <p><strong>PM 2.5:</strong> ${Math.round(dayWeather.air_quality.pm2_5 * 100) / 100}</p>
        </div>
    `);

        weatherInfo.style('opacity', 1);  // Show weatherInfo on mouse over
    }
    
    
    function handleMouseOut() {
        d3.select(this).attr('r', 5);
    
        // Hide the tooltip
        tooltip.transition().duration(500).style('opacity', 0);
    
        // Hide weatherInfo on mouse out
        weatherInfo.style('opacity', 0);
    
    }
    

    function handleMouseOutDelayed() {
        tooltip.transition().duration(500).style('opacity', 0);

        // Hide weatherInfo on mouse out
        weatherInfo.style('opacity', 0);
    }


    tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    }

    // Zoom
    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on('zoom', handleZoom);

    svg.call(zoom);

    function handleZoom(event) {
        const new_xScale = event.transform.rescaleX(xScale);
    
        svg.select('.line')
            .attr('d', line.x(d => new_xScale(d.x) + new_xScale.bandwidth() / 2));
    
        svg.selectAll('.dot')
            .attr('cx', d => new_xScale(d.x) + new_xScale.bandwidth() / 2);
    
        svg.select('.x-axis')
            .call(d3.axisBottom(new_xScale));
    
        svg.select('.y-axis')
            .call(d3.axisLeft(yScale));
    
        // Update the position of the weather information
        const chartContainerRect = chartContainer.node().getBoundingClientRect();
        const currentXPosition = parseFloat(weatherInfo.style('left'));
        const newXPosition = new_xScale(chartdata[0].x) + new_xScale.bandwidth() / 2 + chartContainerRect.left - weatherInfo.node().offsetWidth / 2;
    
        weatherInfo.style('left', newXPosition + 'px');
        
        // Check if the tooltip goes beyond the top of the chart
        const yPosition = yScale(chartdata[0].y) + chartContainerRect.top;
        if (yPosition - tooltip.node().offsetHeight < chartContainerRect.top) {
            tooltip.style('top', yPosition + 'px'); // Display below the point
        } else {
            tooltip.style('top', yPosition - tooltip.node().offsetHeight - 10 + 'px'); // Display above the point
        }
    }

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
}

//for humidity
function visualizeDataHumid(data) {
    const humidityData = data.forecast.forecastday.map(day => ({ x: formatDate(day.date), y: day.day.avghumidity }));

    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const chartContainer = d3.select('.chart-container');

    chartContainer.select('svg').remove();

    const svg = chartContainer
        .append('svg')
        .attr('id', 'line-chart')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(humidityData.map(d => d.x))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([d3.min(humidityData, d => d.y) - 5, d3.max(humidityData, d => d.y) + 5])
        .range([height, 0]);

    const line = d3.line()
        .x(d => xScale(d.x) + xScale.bandwidth() / 2)
        .y(d => yScale(d.y))
        .curve(d3.curveLinear);

    svg.append('path')
        .data([humidityData])
        .attr('class', 'line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#2471A3'); // You can adjust the color as needed

    svg.selectAll('.dot')
        .data(humidityData)
        .enter().append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.x) + xScale.bandwidth() / 2)
        .attr('cy', d => yScale(d.y))
        .attr('r', 5)
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);

    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 5)
        .attr('dy', '1.5em')
        .style('text-anchor', 'middle')
        .text('Date');

    const yAxisGroup = svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale));

    const yAxisLabel = svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left)
        .attr('x', -height / 2)
        .attr('dy', '1.5em')
        .style('text-anchor', 'middle')
        .text('Humidity (%)');

    yAxisGroup.selectAll('text')
        .attr('x', -5)
        .style('text-anchor', 'end');

    const tooltip = chartContainer.append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    const weatherInfo = d3.select('#weatherInfo');

    svg.selectAll('.dot')
        .data(humidityData)
        .enter().append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.x) + xScale.bandwidth() / 2)
        .attr('cy', d => yScale(d.y))
        .attr('r', 5)
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);

    function handleMouseOver(event, d) {
        d3.select(this).attr('r', 8);

        tooltip.transition().duration(200).style('opacity', 0.9);

        const chartContainerRect = chartContainer.node().getBoundingClientRect();

        const xPosition = xScale(d.x) + xScale.bandwidth() / 2 + chartContainerRect.left;
        const yPosition = yScale(d.y) + chartContainerRect.top;

        const tooltipWidth = parseFloat(tooltip.style('width'));
        const xOffset = tooltipWidth / 2;

        tooltip.style('left', xPosition - xOffset + 'px');

        if (yPosition - tooltip.node().offsetHeight < chartContainerRect.top) {
            tooltip.style('top', yPosition + 'px');
        } else {
            tooltip.style('top', yPosition - tooltip.node().offsetHeight - 10 + 'px');
        }

        const dayIndex = humidityData.findIndex(item => item.x === d.x);
        const dayWeather = data.forecast.forecastday[dayIndex].day;

        weatherInfo.html(`
            <h3 class="text-xl">${formatDate(d.x)}</h3>
            <p><strong>Condition:</strong> ${dayWeather.condition.text}</p>
            <p><strong>Humidity:</strong> ${dayWeather.avghumidity}%</p>
        `);

        weatherInfo.style('opacity', 1);
    }

    function handleMouseOut() {
        d3.select(this).attr('r', 5);

        tooltip.transition().duration(500).style('opacity', 0);

        weatherInfo.style('opacity', 0);
    }

    tooltip.transition()
        .duration(500)
        .style('opacity', 0);
}


document.getElementById('temperatureBtn').addEventListener('click', function() {
    displayTemperatureGraph();
});

document.getElementById('humidityBtn').addEventListener('click', function() {
    displayHumidityGraph();
});

function displayTemperatureGraph() {
    visualizeDataTemp(weatherData); // Use weatherData instead of data
}

function displayHumidityGraph() {
    visualizeDataHumid(weatherData); // Use weatherData instead of data
}
import asyncio
from bs4 import BeautifulSoup
import numpy as np
from pyppeteer import launch
import json
import requests
from requests.exceptions import HTTPError


async def main():
    # Launch the browser
    browser = await launch()

    # Open a new browser page
    page = await browser.newPage()

    # Set params
    start = (39.783, 32.8125)
    end = (39.7844, 32.81435)
    tile_size = 2

    # Create URL
    page_path = f"https://ardagurcan.com/projects/occupancy-map?startLat={start[0]}&startLng={start[1]}&endLat={end[0]}&endLng={end[1]}&tileSize={tile_size}"

    # Open our test file in the opened page
    await page.goto(page_path)
    await asyncio.sleep(2)
    page_content = await page.content()

    # Process extracted content with BeautifulSoup
    soup = BeautifulSoup(page_content, features="html.parser")

    # Get result
    global result
    result = soup.find(id="result").get_text()

    # Convert to occupancy array
    occupancy_map = np.array(json.loads(result))

    # Close browser
    await browser.close()

    #
    flat = np.reshape(occupancy_map,(-1,2560))

    for part in flat:
        params = '|'.join([f'{tile["lat"]},{tile["lng"]}' for tile in part])

        response = requests.post('http://77.68.15.151:5000/v1/eudem25m',
                                json={'locations': params})
        # response.raise_for_status()   
        print([tile["elevation"] for tile in response.json()["results"]])
    # Do other stuff

    print(
        f"type: {type(occupancy_map)}, shape: {occupancy_map.shape}, size: {occupancy_map.size}")

loop = asyncio.get_event_loop()

loop.run_until_complete(main())

loop.close()

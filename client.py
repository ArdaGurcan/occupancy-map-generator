import asyncio
from bs4 import BeautifulSoup
import numpy as np
from pyppeteer import launch
import json

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
    await asyncio.sleep(0.5)
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

    # Do other stuff
    print(f"shape: {occupancy_map.shape}, size: {occupancy_map.size}")

loop = asyncio.get_event_loop()

loop.run_until_complete(main())

loop.close()
import asyncio
import newlinejson as nlj
from scramjet.streams import Stream
import json
import random

from gpiozero import CPUTemperature, DiskUsage, LoadAverage, PingServer

provides = {
    'provides': 'pi',
    'contentType': 'plain/text'
}

params = {"cpu_temp":0,'disk_usage':0,'load_avg':0}

async def run(context, input):
    while True:
        params['cpu_temp']= round(CPUTemperature().temperature, 2)
        params['disk_usage']  = round(DiskUsage().usage, 2)
        params['load_avg']  = round(LoadAverage().load_average, 2)
        yield json.dumps(params) + "\n"
        await asyncio.sleep(0.1)


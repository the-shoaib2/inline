# Sample Python file for testing
class DataProcessor:
    def __init__(self, data):
        self.data = data
    
    def process(self):
        """Process the data"""
        return [x * 2 for x in self.data]
    
    def filter_positive(self):
        """Filter positive numbers"""
        return [x for x in self.data if x > 0]

def sort_list(items):
    """Sort a list of items"""
    return sorted(items)

async def fetch_data(url):
    """Fetch data from URL"""
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

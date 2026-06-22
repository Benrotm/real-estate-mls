import urllib.request
import json

urls = [
    'https://services.romimo.ro/swagger/v2/swagger.json',
    'https://services.romimo.ro/swagger/V2/swagger.json',
    'https://services.romimo.ro/swagger/v1/swagger.json',
    'https://services.romimo.ro/swagger/V1/swagger.json'
]

for url in urls:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        res = urllib.request.urlopen(req)
        body = res.read().decode('utf-8')
        print(f'SUCCESS: {url} - Status: {res.status} - Length: {len(body)}')
        data = json.loads(body)
        print('Paths found:', list(data.get('paths', {}).keys()))
        open('scratch/swagger-v2.json', 'w', encoding='utf-8').write(body)
        break
    except Exception as e:
        print(f'FAILED: {url} - Error: {e}')


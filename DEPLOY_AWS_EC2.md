# Deploy AWS EC2 com Docker Compose

## 1. Preparar a instancia

Use uma EC2 Ubuntu 24.04 ou 22.04. No Security Group, libere:

- `22` para SSH, restrito ao seu IP.
- `80` para HTTP.
- `8080` apenas se quiser testar a API diretamente. Para producao, pode manter fechado porque o frontend encaminha as chamadas via Nginx.

Instale Docker:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
```

Saia do SSH e entre novamente para aplicar o grupo `docker`.

## 2. Subir o projeto

```bash
git clone <URL_DO_REPOSITORIO>
cd hcm-system
cp .env.example .env
nano .env
docker compose up -d --build
```

Troque `POSTGRES_PASSWORD` no `.env` antes de subir em producao.

## 3. Acessar

Abra:

```text
http://<IP_PUBLICO_DA_EC2>
```

Usuario inicial:

```text
username: admin
password: 123
```

## 4. Comandos uteis

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
docker compose pull
docker compose up -d --build
docker compose down
```

Para apagar tambem o banco local do container:

```bash
docker compose down -v
```

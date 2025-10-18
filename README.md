# CodeGennie with Ollama Code Generation

This application allows you to explain, refactor, and analyze your code using the Gemini API. Additionally, it integrates with a local [Ollama](https://ollama.com/) instance to provide on-the-fly code generation from comments and AI-powered autocompletion/correction.

## Local Setup for Ollama

To enable code generation (`Ctrl+Enter`) and AI suggestion features, you need to run Ollama and the `codellama:7b` model on your local machine using Docker.

### 1. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.

### 2. Run Ollama Docker Container

Open your terminal and run the following command. This will download the Ollama image and start a container named `ollama`.

```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama -e OLLAMA_ORIGINS='*' ollama/ollama
```

**Command Breakdown:**
- `-d`: Run the container in detached mode (in the background).
- `-v ollama:/root/.ollama`: Creates a Docker volume to persist downloaded models, so you don't have to re-download them every time.
- `-p 11434:11434`: Maps port 11434 on your local machine to the container's port.
- `--name ollama`: Names the container for easy reference.
- `-e OLLAMA_ORIGINS='*'`: **CRUCIAL STEP**. This configures Ollama to accept requests from any origin, which is required for this web app to communicate with it. Without this, you will get "Failed to fetch" errors.
- `ollama/ollama`: The official Ollama Docker image.

**Optional GPU Acceleration:** If you have a compatible NVIDIA GPU and have installed the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html), you can run with GPU support for better performance:
```bash
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama -e OLLAMA_ORIGINS='*' ollama/ollama
```

### 3. Pull the `codellama:7b` Model

Once the container is running, execute the following command in your terminal to download the recommended model. This model offers a great balance of speed and quality for interactive features.

```bash
docker exec -it ollama ollama pull codellama:7b
```
This may take a few minutes to complete.

### 4. Verify Your Setup

You can check that Ollama is running and accessible by running this `curl` command in your terminal:
```bash
curl http://localhost:11434/api/generate -d '{"model": "codellama:7b", "prompt": "Why is the sky blue?"}'
```
If it's working correctly, you will see a JSON response from the model. If you get a "connection refused" error, your container is not running.

### 5. Troubleshooting

**Error: "Failed to fetch" or "Could not connect to Ollama" in the web app.**

This is the most common issue and is almost always a CORS problem. Follow these steps:

1.  **Check if the container is running:** Run `docker ps`. You should see a container with the name `ollama` in the list. If not, start it with `docker start ollama`.
2.  **Verify the `OLLAMA_ORIGINS` flag:** This is critical. If you started the container without `-e OLLAMA_ORIGINS='*'`, the browser cannot connect to it. You must stop and remove the old container and create a new one with the correct command.
    ```bash
    # Stop and remove the old, misconfigured container
    docker stop ollama
    docker rm ollama

    # Re-run the command from Step 2 with the OLLAMA_ORIGINS flag
    docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama -e OLLAMA_ORIGINS='*' ollama/ollama
    ```
3.  **Check for Firewalls or Proxies:** Ensure no firewall or network proxy is blocking connections to `localhost:11434`.

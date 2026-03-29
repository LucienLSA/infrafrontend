.PHONY: help
help:
	@echo "Usage:"
	@echo "  make master                                            # 构建 web 项目打包dist文件"
	@echo "  make clean                                             # 清理 web 项目打包文件"
	@echo "  make master-image                                      # 构建web前端docker镜像"
	@echo "  make master-image ARCH=arm64 TAG=v1.0                  # 完整示例 默认ARCH=amd64 默认TAG=latest"


TAG  ?= latest
ARCH ?= amd64
# 构建 master 镜像（支持选择架构）
# ARCH  - amd64/arm64
# TAG   - 镜像标签，aidoc-web-master_$ARCH: 后面的部分，默认 latest

clean:
	pnpm run clean

master:
	pnpm install
	pnpm run build

master-image:
	@echo "构建 master 镜像，架构 $(ARCH)，版本 $(FEAT)，标签 $(TAG)"
	docker buildx build --load --platform=linux/$(ARCH) -t aidoc-web-master_$(ARCH):$(TAG) -f scripts/deploy/Dockerfile \
	--progress=plain --build-arg FEAT=$(FEAT) --build-arg ARCH=$(ARCH) .
	@echo "master 镜像构建完成 > aidoc-web-master_$(ARCH):$(TAG)"


BACKEND_SERVER ?= http://172.107.232.14:3000
run:
	@echo "运行 aidoc-web 容器，后端服务地址 $(BACKEND_SERVER)"
	docker run -d  --network host --name aidoc-web -e BACKEND_SERVER_URL=$(BACKEND_SERVER)  aidoc-web-master_$(ARCH):$(TAG)
	@echo "aidoc-web 容器运行完成"
<script>
  import { v4 } from "uuid";
  import Noty from 'noty';
  import 'noty/lib/noty.css';
  import 'noty/lib/themes/sunset.css';

  let products = [
    {
      id: 1,
      name: "HP Pavilion Notebook",
      description: "Hp Laptop",
      category: "Laptop",
    },
    {
      id: 2,
      name: "Mouse Razer",
      description: "Gaming mouse",
      category: "peripherials",
    },
  ];

  let editStatus = false;

  let product = {
    id: "",
    name: "",
    description: "",
    category: "",
    imagenURL: "",
  };

  const cleanProduct = () => {
    product = {
      id: "",
      name: "",
      description: "",
      category: "",
      imagenURL: "",
    };
  };

  const addProduct = () => {
    const newProduct = {
      id: v4(),
      name: product.name,
      description: product.description,
      category: product.category,
      imagenURL: product.imagenURL,
    };

    products = products.concat(newProduct);
    cleanProduct();
    console.log(products);
  };

  const updateProduct = () => {
    let updatedProduct = {
      name: product.name,
      description: product.description,
      id: product.id,
      imagenURL: product.imagenURL,
      category: product.category,
    };

    const productIndex = products.findIndex((p) => p.id === product.id);
    products[productIndex] = updatedProduct;
    cleanProduct();
    editStatus = false;
    new Noty({
      theme: 'sunset',
      type: 'success',
      timeout: 3000,
      text: 'Product Update Successfully'
    }).show();
  };

  const onSubmitHandler = (e) => {
    if (!editStatus) {
      addProduct();
    } else {
      updateProduct();
    }
  };

  const deleteProduct = (id) => {
    products = products.filter((product) => product.id !== id);
  };

  const editProduct = (productEdited) => {
    product = productEdited;
    editStatus = true;
  };
</script>

<main>
  <div class="container p-4">
    <div class="row">
      <div class="col-md-6">
        {#each products as product}
          <div class="card mt-2">
            <div class="row">
              <div class="col-md-4">
                {#if !product.imagenURL}
                  <img
                    src="images/no-products.png"
                    alt=""
                    class="img-fluid p-2"
                  />
                {:else}
                  <img src={product.imagenURL} alt="" class="img-fluid p-2" />
                {/if}
              </div>
              <div class="col-md-8">
                <div class="card-body">
                  <h5>
                    <strong>{product.name}</strong>
                    <span>
                      <small>
                        {product.category}
                      </small>
                    </span>
                  </h5>
                  <p class="card-text">{product.description}</p>
                  <button
                    class="btn btn-danger"
                    on:click={deleteProduct(product.id)}
                  >
                    Delete
                  </button>
                  <button
                    class="btn btn-secondary"
                    on:click={editProduct(product)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <form on:submit|preventDefault={onSubmitHandler}>
              <div class="form-group">
                <input
                  bind:value={product.name}
                  type="text"
                  placeholder="Product Name"
                  id="prodcut-name"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <textarea
                  bind:value={product.description}
                  id="product-description"
                  rows="3"
                  placeholder="Product Description"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <input
                  bind:value={product.imagenURL}
                  type="url"
                  id="product-image-url"
                  placeholder="https://link.com"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <select
                  id="category"
                  bind:value={product.category}
                  class="form-control"
                >
                  <option value="Laptops">Laptops</option>
                  <option value="peripherials">Peripherials</option>
                  <option value="Severs">Severs</option>
                </select>
              </div>

              <button class="btn btn-secondary">
                {#if !editStatus} Save Product {:else} Update Product {/if}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

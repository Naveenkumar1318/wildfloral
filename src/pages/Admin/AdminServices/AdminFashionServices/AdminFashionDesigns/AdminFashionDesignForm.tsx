import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  ChangeEvent,
  FormEvent,
} from 'react'

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import { supabase } from '../../../../../lib/supabase'

import './AdminFashionDesignForm.css'

/* =========================================================
   TYPES
========================================================= */

type Category = {
  id: string
  name: string
  is_active: boolean
}

type Subcategory = {
  id: string
  name: string
  category_id: string
  is_active: boolean
}

type ExistingImage = {
  id: string
  image_url: string
  alt_text: string | null
  display_order: number
  is_primary: boolean
}

type ExistingSize = {
  id: string
  size: string
  price: number
  stock_quantity: number
  is_active: boolean
}

type SizeRow = {
  size: string
  price: string
  stockQuantity: string
  isActive: boolean
}

type NewImage = {
  id: string
  file: File
  preview: string
  altText: string
  isPrimary: boolean
}

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_IMAGES = 10
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const MIN_DELIVERY_DAYS = 0
const MAX_DELIVERY_DAYS = 60

const AVAILABLE_SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  'FREE_SIZE',
] as const

/* =========================================================
   HELPERS
========================================================= */

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createEmptySizeRows(): SizeRow[] {
  return AVAILABLE_SIZES.map((size) => ({
    size,
    price: '',
    stockQuantity: '0',
    isActive: false,
  }))
}

function getStoragePathFromUrl(
  url: string | null,
) {
  if (!url) return null

  const marker =
    '/storage/v1/object/public/fashion-images/'

  const index = url.indexOf(marker)

  if (index === -1) return null

  return decodeURIComponent(
    url.slice(index + marker.length),
  )
}

/* =========================================================
   COMPONENT
========================================================= */

function AdminFashionDesignForm() {
  const navigate = useNavigate()

  const { designId } = useParams()

  const isEditMode = Boolean(designId)

  /* =======================================================
     CATEGORY / SUBCATEGORY
  ======================================================= */

  const [categories, setCategories] =
    useState<Category[]>([])

  const [subcategories, setSubcategories] =
    useState<Subcategory[]>([])

  const [categoryId, setCategoryId] =
    useState('')

  const [subcategoryId, setSubcategoryId] =
    useState('')

  /* =======================================================
     SERVICE INFORMATION
  ======================================================= */

  const [name, setName] =
    useState('')

  const [description, setDescription] =
    useState('')

  const [productDetails, setProductDetails] =
    useState('')

  const [additionalInformation, setAdditionalInformation] =
    useState('')

  const [isActive, setIsActive] =
    useState(true)

  const [isFeatured, setIsFeatured] =
    useState(false)

  /* =======================================================
     DELIVERY RANGE
  ======================================================= */

  const [deliveryMinDays, setDeliveryMinDays] =
    useState('1')

  const [deliveryMaxDays, setDeliveryMaxDays] =
    useState('5')

  /* =======================================================
     IMAGES
  ======================================================= */

  const [existingImages, setExistingImages] =
    useState<ExistingImage[]>([])

  const [newImages, setNewImages] =
    useState<NewImage[]>([])

  const [deletedImageIds, setDeletedImageIds] =
    useState<string[]>([])

  /* =======================================================
     SIZES
  ======================================================= */

  const [sizes, setSizes] =
    useState<SizeRow[]>(
      createEmptySizeRows(),
    )

  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(isEditMode)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  /* =========================================================
     LOAD CATEGORIES
  ========================================================= */

  const loadCategories = useCallback(
    async () => {
      const {
        data,
        error: fetchError,
      } = await supabase
        .from('fashion_categories')
        .select(
          'id,name,is_active',
        )
        .eq(
          'is_active',
          true,
        )
        .order(
          'name',
          {
            ascending: true,
          },
        )

      if (fetchError) {
        setError(
          fetchError.message,
        )
        return
      }

      setCategories(
        data ?? [],
      )
    },
    [],
  )

  /* =========================================================
     LOAD SUBCATEGORIES
  ========================================================= */

  const loadSubcategories =
    useCallback(
      async () => {
        const {
          data,
          error: fetchError,
        } = await supabase
          .from(
            'fashion_subcategories',
          )
          .select(
            'id,name,category_id,is_active',
          )
          .eq(
            'is_active',
            true,
          )
          .order(
            'name',
            {
              ascending: true,
            },
          )

        if (fetchError) {
          setError(
            fetchError.message,
          )
          return
        }

        setSubcategories(
          data ?? [],
        )
      },
      [],
    )

  /* =========================================================
     LOAD DESIGN
  ========================================================= */

  const loadDesign =
    useCallback(
      async () => {
        if (!designId) {
          return
        }

        const {
          data,
          error: fetchError,
        } = await supabase
          .from(
            'fashion_designs',
          )
          .select(`
            id,
            subcategory_id,
            name,
            slug,
            description,
            product_details,
            additional_information,
            is_active,
            is_featured,
            delivery_min_days,
            delivery_max_days,

            fashion_subcategories (
              id,
              category_id
            ),

            fashion_design_images (
              id,
              image_url,
              alt_text,
              display_order,
              is_primary
            ),

            fashion_design_sizes (
              id,
              size,
              price,
              stock_quantity,
              is_active
            )
          `)
          .eq(
            'id',
            designId,
          )
          .single()

        if (fetchError) {
          setError(
            fetchError.message,
          )
          setLoading(false)
          return
        }

        setName(
          data.name ?? '',
        )

        setDescription(
          data.description ?? '',
        )

        setProductDetails(
          data.product_details ?? '',
        )

        setAdditionalInformation(
          data.additional_information ?? '',
        )

        setIsActive(
          data.is_active ?? true,
        )

        setIsFeatured(
          data.is_featured ?? false,
        )

        setDeliveryMinDays(
          String(
            data.delivery_min_days ?? 1,
          ),
        )

        setDeliveryMaxDays(
          String(
            data.delivery_max_days ?? 5,
          ),
        )

        const rawSubcategory =
          Array.isArray(
            data.fashion_subcategories,
          )
            ? data.fashion_subcategories[0]
            : data.fashion_subcategories

        const loadedCategoryId =
          rawSubcategory?.category_id ??
          ''

        setCategoryId(
          loadedCategoryId,
        )

        setSubcategoryId(
          data.subcategory_id ?? '',
        )

        const loadedImages =
          (
            data.fashion_design_images ??
            []
          ) as ExistingImage[]

        loadedImages.sort(
          (
            first,
            second,
          ) =>
            first.display_order -
            second.display_order,
        )

        setExistingImages(
          loadedImages,
        )

        const loadedSizes =
          (
            data.fashion_design_sizes ??
            []
          ) as ExistingSize[]

        const loadedSizeMap =
          new Map(
            loadedSizes.map(
              (size) => [
                size.size,
                size,
              ],
            ),
          )

        setSizes(
          AVAILABLE_SIZES.map(
            (size) => {
              const existing =
                loadedSizeMap.get(
                  size,
                )

              if (!existing) {
                return {
                  size,
                  price: '',
                  stockQuantity:
                    '0',
                  isActive:
                    false,
                }
              }

              return {
                size,
                price:
                  String(
                    existing.price,
                  ),
                stockQuantity:
                  String(
                    existing.stock_quantity,
                  ),
                isActive:
                  existing.is_active,
              }
            },
          ),
        )

        setLoading(false)
      },
      [designId],
    )

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    void loadCategories()
    void loadSubcategories()
  }, [
    loadCategories,
    loadSubcategories,
  ])

  useEffect(() => {
    void loadDesign()
  }, [
    loadDesign,
  ])

  /* =========================================================
     CATEGORY CHANGE
  ========================================================= */

  function handleCategoryChange(
    nextCategoryId: string,
  ) {
    setCategoryId(
      nextCategoryId,
    )

    const validCurrentSubcategory =
      subcategories.some(
        (subcategory) =>
          subcategory.id ===
            subcategoryId &&
          subcategory.category_id ===
            nextCategoryId,
      )

    if (
      !validCurrentSubcategory
    ) {
      setSubcategoryId('')
    }
  }

  /* =========================================================
     FILTERED SUBCATEGORIES
  ========================================================= */

  const filteredSubcategories =
    useMemo(
      () =>
        subcategories.filter(
          (subcategory) =>
            subcategory.category_id ===
            categoryId,
        ),
      [
        subcategories,
        categoryId,
      ],
    )

  /* =========================================================
     NAME
  ========================================================= */

  function handleNameChange(
    value: string,
  ) {
    setName(value)
  }

  /* =========================================================
     IMAGE COUNT
  ========================================================= */

  const activeExistingImages =
    useMemo(
      () =>
        existingImages.filter(
          (image) =>
            !deletedImageIds.includes(
              image.id,
            ),
        ),
      [
        existingImages,
        deletedImageIds,
      ],
    )

  const imageCount =
    activeExistingImages.length +
    newImages.length

  const remainingImageSlots =
    Math.max(
      0,
      MAX_IMAGES -
        imageCount,
    )

  /* =========================================================
     IMAGE CHANGE
  ========================================================= */

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files =
      Array.from(
        event.target.files ?? [],
      )

    event.target.value = ''

    if (!files.length) {
      return
    }

    setError('')

    if (
      remainingImageSlots === 0
    ) {
      setError(
        `Maximum ${MAX_IMAGES} images are allowed.`,
      )
      return
    }

    const selectedFiles =
      files.slice(
        0,
        remainingImageSlots,
      )

    if (
      files.length >
      remainingImageSlots
    ) {
      setError(
        `Only ${remainingImageSlots} image${
          remainingImageSlots === 1
            ? ''
            : 's'
        } can be added. Maximum is ${MAX_IMAGES}.`,
      )
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    const validImages: NewImage[] =
      []

    for (
      const file of selectedFiles
    ) {
      if (
        !allowedTypes.includes(
          file.type,
        )
      ) {
        setError(
          'Only JPG, PNG and WebP images are allowed.',
        )
        continue
      }

      if (
        file.size >
        MAX_IMAGE_SIZE
      ) {
        setError(
          'Each image must be 5 MB or less.',
        )
        continue
      }

      const preview =
        URL.createObjectURL(
          file,
        )

      validImages.push({
        id: crypto.randomUUID(),
        file,
        preview,
        altText:
          name.trim(),
        isPrimary:
          false,
      })
    }

    if (!validImages.length) {
      return
    }

    setNewImages(
      (current) => [
        ...current,
        ...validImages,
      ],
    )
  }

  /* =========================================================
     REMOVE EXISTING IMAGE
  ========================================================= */

  function removeExistingImage(
    imageId: string,
  ) {
    setDeletedImageIds(
      (current) =>
        current.includes(
          imageId,
        )
          ? current
          : [
              ...current,
              imageId,
            ],
    )
  }

  /* =========================================================
     RESTORE EXISTING IMAGE
  ========================================================= */

  function restoreExistingImage(
    imageId: string,
  ) {
    setDeletedImageIds(
      (current) =>
        current.filter(
          (id) =>
            id !== imageId,
        ),
    )
  }

  /* =========================================================
     REMOVE NEW IMAGE
  ========================================================= */

  function removeNewImage(
    imageId: string,
  ) {
    setNewImages(
      (current) => {
        const image =
          current.find(
            (item) =>
              item.id ===
              imageId,
          )

        if (image) {
          URL.revokeObjectURL(
            image.preview,
          )
        }

        return current.filter(
          (item) =>
            item.id !==
            imageId,
        )
      },
    )
  }

  /* =========================================================
     SET EXISTING PRIMARY
  ========================================================= */

  function setExistingPrimary(
    imageId: string,
  ) {
    setExistingImages(
      (current) =>
        current.map(
          (image) => ({
            ...image,
            is_primary:
              image.id ===
                imageId &&
              !deletedImageIds.includes(
                image.id,
              ),
          }),
        ),
    )

    setNewImages(
      (current) =>
        current.map(
          (image) => ({
            ...image,
            isPrimary: false,
          }),
        ),
    )
  }

  /* =========================================================
     SET NEW PRIMARY
  ========================================================= */

  function setNewPrimary(
    imageId: string,
  ) {
    setExistingImages(
      (current) =>
        current.map(
          (image) => ({
            ...image,
            is_primary: false,
          }),
        ),
    )

    setNewImages(
      (current) =>
        current.map(
          (image) => ({
            ...image,
            isPrimary:
              image.id ===
              imageId,
          }),
        ),
    )
  }

  /* =========================================================
     UPDATE SIZE
  ========================================================= */

  function updateSize(
    size: string,
    field: keyof SizeRow,
    value:
      | string
      | boolean,
  ) {
    setSizes(
      (current) =>
        current.map(
          (row) =>
            row.size ===
            size
              ? {
                  ...row,
                  [field]:
                    value,
                }
              : row,
        ),
    )
  }

  /* =========================================================
     UPLOAD DESIGN IMAGE
  ========================================================= */

  async function uploadDesignImage(
    file: File,
    currentDesignId: string,
  ) {
    const extension =
      file.type ===
      'image/webp'
        ? 'webp'
        : file.type ===
            'image/png'
          ? 'png'
          : 'jpg'

    const filePath =
      `fashion/designs/${currentDesignId}/${crypto.randomUUID()}.${extension}`

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(
          'fashion-images',
        )
        .upload(
          filePath,
          file,
          {
            cacheControl:
              '3600',
            upsert:
              false,
            contentType:
              file.type,
          },
        )

    if (uploadError) {
      throw new Error(
        `Image upload failed: ${uploadError.message}`,
      )
    }

    const {
      data: {
        publicUrl,
      },
    } =
      supabase.storage
        .from(
          'fashion-images',
        )
        .getPublicUrl(
          filePath,
        )

    return {
      publicUrl,
      filePath,
    }
  }

  /* =========================================================
     SUBMIT
  ========================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    const cleanName =
      name.trim()

    const cleanDescription =
      description.trim()

    if (!cleanName) {
      setError(
        'Service name is required.',
      )
      return
    }

    if (!categoryId) {
      setError(
        'Please select a main category.',
      )
      return
    }

    if (!subcategoryId) {
      setError(
        'Please select a sub category.',
      )
      return
    }

    const validSubcategory =
      subcategories.find(
        (item) =>
          item.id ===
          subcategoryId,
      )

    if (
      !validSubcategory ||
      validSubcategory.category_id !==
        categoryId
    ) {
      setError(
        'The selected sub category does not belong to the selected main category.',
      )
      return
    }

    if (!cleanDescription) {
      setError(
        'Service description is required.',
      )
      return
    }

    /* =======================================================
       DELIVERY VALIDATION
    ======================================================= */

    const minDelivery =
      Number(
        deliveryMinDays,
      )

    const maxDelivery =
      Number(
        deliveryMaxDays,
      )

    if (
      !Number.isInteger(
        minDelivery,
      ) ||
      minDelivery <
        MIN_DELIVERY_DAYS ||
      minDelivery >
        MAX_DELIVERY_DAYS
    ) {
      setError(
        `Minimum delivery days must be between ${MIN_DELIVERY_DAYS} and ${MAX_DELIVERY_DAYS}.`,
      )
      return
    }

    if (
      !Number.isInteger(
        maxDelivery,
      ) ||
      maxDelivery <
        MIN_DELIVERY_DAYS ||
      maxDelivery >
        MAX_DELIVERY_DAYS
    ) {
      setError(
        `Maximum delivery days must be between ${MIN_DELIVERY_DAYS} and ${MAX_DELIVERY_DAYS}.`,
      )
      return
    }

    if (
      minDelivery >
      maxDelivery
    ) {
      setError(
        'Minimum delivery days cannot be greater than maximum delivery days.',
      )
      return
    }

    /* =======================================================
       SIZE VALIDATION
    ======================================================= */

    const activeSizes =
      sizes.filter(
        (size) =>
          size.isActive,
      )

    if (!activeSizes.length) {
      setError(
        'Select at least one available size.',
      )
      return
    }

    for (
      const size of activeSizes
    ) {
      const price =
        Number(
          size.price,
        )

      const stock =
        Number(
          size.stockQuantity,
        )

      if (
        size.price === '' ||
        !Number.isFinite(
          price,
        ) ||
        price < 0
      ) {
        setError(
          `Enter a valid price for ${size.size}.`,
        )
        return
      }

      if (
        size.stockQuantity ===
          '' ||
        !Number.isInteger(
          stock,
        ) ||
        stock < 0
      ) {
        setError(
          `Enter a valid stock quantity for ${size.size}.`,
        )
        return
      }
    }

    /* =======================================================
       IMAGE VALIDATION
    ======================================================= */

    const finalExistingImages =
      existingImages.filter(
        (image) =>
          !deletedImageIds.includes(
            image.id,
          ),
      )

    const finalImageCount =
      finalExistingImages.length +
      newImages.length

    if (
      finalImageCount === 0
    ) {
      setError(
        'Please add at least one service image.',
      )
      return
    }

    if (
      finalImageCount >
      MAX_IMAGES
    ) {
      setError(
        `A maximum of ${MAX_IMAGES} service images are allowed.`,
      )
      return
    }

    const existingPrimary =
      finalExistingImages.find(
        (image) =>
          image.is_primary,
      )

    const newPrimary =
      newImages.find(
        (image) =>
          image.isPrimary,
      )

    if (
      !existingPrimary &&
      !newPrimary
    ) {
      setError(
        'Please select one primary service image.',
      )
      return
    }

    setSaving(true)

    let createdDesignId:
      | string
      | null = null

    const uploadedPaths: string[] =
      []

    try {
      /* =====================================================
         GENERATE INTERNAL SLUG
      ===================================================== */

      const generatedSlug =
        slugify(
          cleanName,
        ) ||
        `fashion-service-${crypto.randomUUID().slice(0, 8)}`

      /* =====================================================
         SAVE MAIN DESIGN
      ===================================================== */

      if (
        isEditMode &&
        designId
      ) {
        createdDesignId =
          designId

        const {
          error: updateError,
        } =
          await supabase
            .from(
              'fashion_designs',
            )
            .update({
              subcategory_id:
                subcategoryId,

              name:
                cleanName,

              slug:
                generatedSlug,

              description:
                cleanDescription,

              product_details:
                productDetails.trim(),

              additional_information:
                additionalInformation.trim(),

              is_active:
                isActive,

              is_featured:
                isFeatured,

              delivery_min_days:
                minDelivery,

              delivery_max_days:
                maxDelivery,

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              designId,
            )

        if (updateError) {
          throw new Error(
            updateError.message,
          )
        }
      } else {
        const {
          data,
          error: insertError,
        } =
          await supabase
            .from(
              'fashion_designs',
            )
            .insert({
              subcategory_id:
                subcategoryId,

              name:
                cleanName,

              slug:
                `${generatedSlug}-${crypto.randomUUID().slice(0, 8)}`,

              description:
                cleanDescription,

              product_details:
                productDetails.trim(),

              additional_information:
                additionalInformation.trim(),

              is_active:
                isActive,

              is_featured:
                isFeatured,

              delivery_min_days:
                minDelivery,

              delivery_max_days:
                maxDelivery,
            })
            .select(
              'id',
            )
            .single()

        if (insertError) {
          throw new Error(
            insertError.message,
          )
        }

        createdDesignId =
          data.id
      }

      if (
        !createdDesignId
      ) {
        throw new Error(
          'Unable to determine service ID.',
        )
      }

      /* =====================================================
         DELETE REMOVED EXISTING IMAGES
      ===================================================== */

      if (
        deletedImageIds.length
      ) {
        const deletedImages =
          existingImages.filter(
            (image) =>
              deletedImageIds.includes(
                image.id,
              ),
          )

        const deletedPaths =
          deletedImages
            .map(
              (image) =>
                getStoragePathFromUrl(
                  image.image_url,
                ),
            )
            .filter(
              Boolean,
            ) as string[]

        const {
          error:
            deleteImagesError,
        } =
          await supabase
            .from(
              'fashion_design_images',
            )
            .delete()
            .in(
              'id',
              deletedImageIds,
            )

        if (
          deleteImagesError
        ) {
          throw new Error(
            deleteImagesError.message,
          )
        }

        if (
          deletedPaths.length
        ) {
          await supabase.storage
            .from(
              'fashion-images',
            )
            .remove(
              deletedPaths,
            )
        }
      }

      /* =====================================================
         NORMALIZE PRIMARY
      ===================================================== */

      if (
        newPrimary
      ) {
        const {
          error:
            clearPrimaryError,
        } =
          await supabase
            .from(
              'fashion_design_images',
            )
            .update({
              is_primary:
                false,
            })
            .eq(
              'design_id',
              createdDesignId,
            )

        if (
          clearPrimaryError
        ) {
          throw new Error(
            clearPrimaryError.message,
          )
        }
      }

      /* =====================================================
         SAVE EXISTING PRIMARY
      ===================================================== */

      if (
        existingPrimary &&
        !newPrimary
      ) {
        const {
          error:
            primaryError,
        } =
          await supabase
            .from(
              'fashion_design_images',
            )
            .update({
              is_primary:
                true,
            })
            .eq(
              'id',
              existingPrimary.id,
            )

        if (
          primaryError
        ) {
          throw new Error(
            primaryError.message,
          )
        }
      }

      /* =====================================================
         UPLOAD NEW IMAGES
      ===================================================== */

      const startingOrder =
        finalExistingImages.length

      const uploadedImages: {
        publicUrl: string
        filePath: string
        isPrimary: boolean
        altText: string
        displayOrder: number
      }[] = []

      for (
        let index = 0;
        index <
        newImages.length;
        index++
      ) {
        const image =
          newImages[index]

        const uploaded =
          await uploadDesignImage(
            image.file,
            createdDesignId,
          )

        uploadedPaths.push(
          uploaded.filePath,
        )

        uploadedImages.push({
          publicUrl:
            uploaded.publicUrl,

          filePath:
            uploaded.filePath,

          isPrimary:
            image.isPrimary,

          altText:
            image.altText ||
            cleanName,

          displayOrder:
            startingOrder +
            index,
        })
      }

      if (
        uploadedImages.length
      ) {
        const {
          error:
            insertImagesError,
        } =
          await supabase
            .from(
              'fashion_design_images',
            )
            .insert(
              uploadedImages.map(
                (
                  image,
                ) => ({
                  design_id:
                    createdDesignId,

                  image_url:
                    image.publicUrl,

                  alt_text:
                    image.altText,

                  display_order:
                    image.displayOrder,

                  is_primary:
                    image.isPrimary,
                }),
              ),
            )

        if (
          insertImagesError
        ) {
          throw new Error(
            insertImagesError.message,
          )
        }
      }

      /* =====================================================
         REBUILD SIZE DATA
      ===================================================== */

      const {
        error:
          deleteSizesError,
      } =
        await supabase
          .from(
            'fashion_design_sizes',
          )
          .delete()
          .eq(
            'design_id',
            createdDesignId,
          )

      if (
        deleteSizesError
      ) {
        throw new Error(
          deleteSizesError.message,
        )
      }

      const {
        error:
          insertSizesError,
      } =
        await supabase
          .from(
            'fashion_design_sizes',
          )
          .insert(
            activeSizes.map(
              (size) => ({
                design_id:
                  createdDesignId,

                size:
                  size.size,

                price:
                  Number(
                    size.price,
                  ),

                stock_quantity:
                  Number(
                    size.stockQuantity,
                  ),

                is_active:
                  true,
              }),
            ),
          )

      if (
        insertSizesError
      ) {
        throw new Error(
          insertSizesError.message,
        )
      }

      /* =====================================================
         CLEANUP PREVIEWS
      ===================================================== */

      newImages.forEach(
        (image) =>
          URL.revokeObjectURL(
            image.preview,
          ),
      )

      navigate(
        '/admin/services/fashion/designs',
        {
          replace: true,
        },
      )
    } catch (
      submitError
    ) {
      if (
        uploadedPaths.length
      ) {
        await supabase.storage
          .from(
            'fashion-images',
          )
          .remove(
            uploadedPaths,
          )
      }

      if (
        !isEditMode &&
        createdDesignId
      ) {
        await supabase
          .from(
            'fashion_designs',
          )
          .delete()
          .eq(
            'id',
            createdDesignId,
          )
      }

      setError(
        submitError instanceof
          Error
          ? submitError.message
          : 'Unable to save fashion service.',
      )
    } finally {
      setSaving(false)
    }
  }

  /* =========================================================
     CLEANUP IMAGE PREVIEWS
  ========================================================= */

  useEffect(() => {
    return () => {
      newImages.forEach(
        (image) => {
          if (
            image.preview.startsWith(
              'blob:',
            )
          ) {
            URL.revokeObjectURL(
              image.preview,
            )
          }
        },
      )
    }
  }, [newImages])

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="fashion-design-form-page">
        <div className="fashion-design-form-loading">
          <div className="fashion-design-form-spinner" />

          <span>
            Loading fashion service...
          </span>
        </div>
      </main>
    )
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="fashion-design-form-page">
      <div className="fashion-design-form-shell">

        <Link
          to="/admin/services/fashion/designs"
          className="fashion-design-form-back"
        >
          ← Back to Fashion Services
        </Link>

        <header className="fashion-design-form-header">
          <span>
            FASHION / SERVICE
          </span>

          <h1>
            {isEditMode
              ? 'Edit Fashion Service'
              : 'Create Fashion Service'}
          </h1>

          <p>
            Create a ready-made fashion
            service under a main category
            and subcategory.
          </p>
        </header>

        {error && (
          <div
            className="fashion-design-form-error"
            role="alert"
          >
            <span>!</span>

            <p>
              {error}
            </p>
          </div>
        )}

        <form
          className="fashion-design-form"
          onSubmit={
            handleSubmit
          }
        >

          {/* =================================================
              SERVICE INFORMATION
          ================================================= */}

          <section className="fashion-design-form-card">

            <div className="fashion-design-form-heading">
              <h2>
                Service Information
              </h2>

              <p>
                Define where this service
                belongs in your catalogue.
              </p>
            </div>

            <div className="fashion-design-form-grid">

              <label>
                <span>
                  Main Category *
                </span>

                <select
                  value={
                    categoryId
                  }
                  onChange={(event) =>
                    handleCategoryChange(
                      event.target.value,
                    )
                  }
                  required
                >
                  <option value="">
                    Select main category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {category.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>
                  Sub Category *
                </span>

                <select
                  value={
                    subcategoryId
                  }
                  onChange={(event) =>
                    setSubcategoryId(
                      event.target.value,
                    )
                  }
                  disabled={
                    !categoryId
                  }
                  required
                >
                  <option value="">
                    {categoryId
                      ? 'Select sub category'
                      : 'Select main category first'}
                  </option>

                  {filteredSubcategories.map(
                    (
                      subcategory,
                    ) => (
                      <option
                        key={
                          subcategory.id
                        }
                        value={
                          subcategory.id
                        }
                      >
                        {
                          subcategory.name
                        }
                      </option>
                    ),
                  )}
                </select>

                {categoryId &&
                  !filteredSubcategories.length && (
                    <small>
                      Create an active
                      subcategory for this
                      main category first.
                    </small>
                  )}
              </label>

              <label>
                <span>
                  Service Name *
                </span>

                <input
                  value={
                    name
                  }
                  onChange={(event) =>
                    handleNameChange(
                      event.target.value,
                    )
                  }
                  placeholder="Royal Anarkali"
                  maxLength={
                    150
                  }
                  required
                />
              </label>

              <label className="full-width">
                <span>
                  Description *
                </span>

                <textarea
                  value={
                    description
                  }
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Describe the fabric, design, fitting and other service details..."
                  rows={
                    5
                  }
                  maxLength={
                    1000
                  }
                  required
                />

                <small>
                  {
                    description.length
                  }
                  /1000
                </small>
              </label>

            </div>

          </section>

          {/* =================================================
              PRODUCT DETAILS
          ================================================= */}

          <section className="fashion-design-form-card">

            <div className="fashion-design-form-heading">

              <h2>
                Product Details
              </h2>

              <p>
                Add the detailed information
                customers should see about this
                fashion item.
              </p>

            </div>

            <label className="fashion-design-form-full-field">

              <span>
                About This Item
              </span>

              <textarea
                value={
                  productDetails
                }
                onChange={(event) =>
                  setProductDetails(
                    event.target.value,
                  )
                }
                placeholder={`Example:

• Style Number - AW88
• Super Combed Cotton Rich Fabric
• Relaxed Fit
• Round Neck
• Curved Hem Styling
• Label Free for All Day Comfort
• Gentle wash 40°C; Do not bleach; Do not wring
• Low iron; Do not dry clean`}
                rows={
                  10
                }
                maxLength={
                  5000
                }
              />

              <small>
                {productDetails.length}
                /5000
              </small>

            </label>

          </section>

          {/* =================================================
              ADDITIONAL INFORMATION
          ================================================= */}

          <section className="fashion-design-form-card">

            <div className="fashion-design-form-heading">

              <h2>
                Additional Information
              </h2>

              <p>
                Add manufacturer, packer, weight,
                dimensions, quantity and other
                information.
              </p>

            </div>

            <label className="fashion-design-form-full-field">

              <span>
                Additional Information
              </span>

              <textarea
                value={
                  additionalInformation
                }
                onChange={(event) =>
                  setAdditionalInformation(
                    event.target.value,
                  )
                }
                placeholder={`Example:

Manufacturer: PAGE INDUSTRIES LIMITED
Packer: PAGE INDUSTRIES LIMITED
Item Weight: 195 g
Item Dimensions: 24.5 x 23.5 x 0.5 Centimeters
Net Quantity: 1 Count
Generic Name: T-Shirt`}
                rows={
                  10
                }
                maxLength={
                  5000
                }
              />

              <small>
                {additionalInformation.length}
                /5000
              </small>

            </label>

          </section>

          {/* =================================================
              DELIVERY RANGE
          ================================================= */}

          <section className="fashion-design-form-card">

            <div className="fashion-design-form-heading">

              <h2>
                Delivery Range
              </h2>

              <p>
                Set the expected delivery
                window customers will see.
              </p>

            </div>

            <div className="fashion-delivery-grid">

              <label>
                <span>
                  Minimum Days *
                </span>

                <input
                  type="number"
                  min={
                    MIN_DELIVERY_DAYS
                  }
                  max={
                    MAX_DELIVERY_DAYS
                  }
                  step="1"
                  value={
                    deliveryMinDays
                  }
                  onChange={(event) =>
                    setDeliveryMinDays(
                      event.target.value,
                    )
                  }
                  required
                />

                <small>
                  Earliest delivery
                </small>
              </label>

              <div className="fashion-delivery-range-separator">
                to
              </div>

              <label>
                <span>
                  Maximum Days *
                </span>

                <input
                  type="number"
                  min={
                    MIN_DELIVERY_DAYS
                  }
                  max={
                    MAX_DELIVERY_DAYS
                  }
                  step="1"
                  value={
                    deliveryMaxDays
                  }
                  onChange={(event) =>
                    setDeliveryMaxDays(
                      event.target.value,
                    )
                  }
                  required
                />

                <small>
                  Latest delivery
                </small>
              </label>

              <div className="fashion-delivery-preview">

                <span>
                  Customer delivery
                </span>

                <strong>
                  {deliveryMinDays || '—'}
                  {' – '}
                  {deliveryMaxDays || '—'}
                  {' '}
                  days
                </strong>

              </div>

            </div>

          </section>

          {/* =================================================
              SERVICE IMAGES
          ================================================= */}

          <section className="fashion-design-form-card">

            <div className="fashion-design-form-heading">

              <h2>
                Service Images
              </h2>

              <p>
                Add up to {MAX_IMAGES}
                {' '}
                images and choose
                one primary image.
              </p>

            </div>

            <div className="fashion-design-upload-row">

              <div className="fashion-design-image-counter">
                <strong>
                  {imageCount}
                </strong>

                <span>
                  / {MAX_IMAGES}
                  {' '}
                  images
                </span>
              </div>

              <label
                className={`fashion-design-upload-button ${
                  remainingImageSlots ===
                  0
                    ? 'disabled'
                    : ''
                }`}
              >
                {remainingImageSlots ===
                0
                  ? 'Image Limit Reached'
                  : 'Add Images'}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={
                    remainingImageSlots ===
                    0
                  }
                  onChange={
                    handleImageChange
                  }
                />
              </label>

            </div>

            <div className="fashion-design-upload-help">
              <span>
                JPG, PNG or WebP
              </span>

              <span>
                Maximum 5 MB per image
              </span>

              <span>
                {remainingImageSlots}
                {' '}
                slots remaining
              </span>
            </div>

            {(existingImages.length >
              0 ||
              newImages.length >
                0) && (

              <div className="fashion-design-images-grid">

                {existingImages.map(
                  (image) => {
                    const deleted =
                      deletedImageIds.includes(
                        image.id,
                      )

                    return (
                      <div
                        className={`fashion-design-image-item ${
                          image.is_primary &&
                          !deleted
                            ? 'primary'
                            : ''
                        } ${
                          deleted
                            ? 'deleted'
                            : ''
                        }`}
                        key={
                          image.id
                        }
                      >

                        <div className="fashion-design-image-frame">

                          <img
                            src={
                              image.image_url
                            }
                            alt={
                              image.alt_text ||
                              name
                            }
                            loading="lazy"
                            decoding="async"
                          />

                          {image.is_primary &&
                            !deleted && (
                              <span className="fashion-primary-label">
                                Primary
                              </span>
                            )}

                          {deleted && (
                            <span className="fashion-deleted-label">
                              Removed
                            </span>
                          )}

                        </div>

                        <div className="fashion-design-image-actions">

                          {deleted ? (
                            <button
                              type="button"
                              onClick={() =>
                                restoreExistingImage(
                                  image.id,
                                )
                              }
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setExistingPrimary(
                                    image.id,
                                  )
                                }
                                disabled={
                                  image.is_primary
                                }
                              >
                                {image.is_primary
                                  ? 'Primary Image'
                                  : 'Make Primary'}
                              </button>

                              <button
                                type="button"
                                className="danger"
                                onClick={() =>
                                  removeExistingImage(
                                    image.id,
                                  )
                                }
                              >
                                Remove
                              </button>
                            </>
                          )}

                        </div>

                      </div>
                    )
                  },
                )}

                {newImages.map(
                  (image) => (
                    <div
                      className={`fashion-design-image-item ${
                        image.isPrimary
                          ? 'primary'
                          : ''
                      }`}
                      key={
                        image.id
                      }
                    >

                      <div className="fashion-design-image-frame">

                        <img
                          src={
                            image.preview
                          }
                          alt={
                            image.altText ||
                            name
                          }
                        />

                        {image.isPrimary && (
                          <span className="fashion-primary-label">
                            Primary
                          </span>
                        )}

                        <span className="fashion-new-image-label">
                          New
                        </span>

                      </div>

                      <div className="fashion-design-image-actions">

                        <button
                          type="button"
                          onClick={() =>
                            setNewPrimary(
                              image.id,
                            )
                          }
                          disabled={
                            image.isPrimary
                          }
                        >
                          {image.isPrimary
                            ? 'Primary Image'
                            : 'Make Primary'}
                        </button>

                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            removeNewImage(
                              image.id,
                            )
                          }
                        >
                          Remove
                        </button>

                      </div>

                    </div>
                  ),
                )}

              </div>
            )}

          </section>

          {/* =================================================
              SIZES
          ================================================= */}

          <section className="fashion-design-form-card">

            <div className="fashion-design-form-heading">

              <h2>
                Sizes, Pricing & Stock
              </h2>

              <p>
                Enable the sizes available
                for this service.
              </p>

            </div>

            <div className="fashion-size-summary">

              <strong>
                {
                  sizes.filter(
                    (size) =>
                      size.isActive,
                  ).length
                }
              </strong>

              <span>
                available sizes
              </span>

            </div>

            <div className="fashion-size-table-wrapper">

              <table className="fashion-size-table">

                <thead>
                  <tr>
                    <th>
                      Size
                    </th>

                    <th>
                      Price
                    </th>

                    <th>
                      Stock
                    </th>

                    <th>
                      Available
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {sizes.map(
                    (size) => (
                      <tr
                        key={
                          size.size
                        }
                      >

                        <td>
                          <strong>
                            {
                              size.size
                            }
                          </strong>
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              size.price
                            }
                            disabled={
                              !size.isActive
                            }
                            onChange={(
                              event,
                            ) =>
                              updateSize(
                                size.size,
                                'price',
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="0.00"
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              size.stockQuantity
                            }
                            disabled={
                              !size.isActive
                            }
                            onChange={(
                              event,
                            ) =>
                              updateSize(
                                size.size,
                                'stockQuantity',
                                event
                                  .target
                                  .value,
                              )
                            }
                          />
                        </td>

                        <td>

                          <button
                            type="button"
                            className={`fashion-size-toggle ${
                              size.isActive
                                ? 'active'
                                : ''
                            }`}
                            onClick={() =>
                              updateSize(
                                size.size,
                                'isActive',
                                !size.isActive,
                              )
                            }
                            aria-label={`Toggle ${size.size}`}
                          >
                            <span />
                          </button>

                        </td>

                      </tr>
                    ),
                  )}

                </tbody>

              </table>

            </div>

          </section>

          {/* =================================================
              SERVICE STATUS
          ================================================= */}

          <section className="fashion-design-form-card">

            <div className="fashion-design-setting-row">

              <div>
                <h2>
                  Service Status
                </h2>

                <p>
                  Control visibility and
                  featured placement.
                </p>
              </div>

              <div className="fashion-design-setting-controls">

                <button
                  type="button"
                  className={`fashion-setting-toggle ${
                    isActive
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setIsActive(
                      (value) =>
                        !value,
                    )
                  }
                  aria-pressed={
                    isActive
                  }
                >
                  <span />
                </button>

                <label>
                  <strong>
                    Active
                  </strong>

                  <small>
                    Visible in catalogue
                  </small>
                </label>

              </div>

              <div className="fashion-design-setting-controls">

                <button
                  type="button"
                  className={`fashion-setting-toggle ${
                    isFeatured
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setIsFeatured(
                      (value) =>
                        !value,
                    )
                  }
                  aria-pressed={
                    isFeatured
                  }
                >
                  <span />
                </button>

                <label>
                  <strong>
                    Featured
                  </strong>

                  <small>
                    Show as featured
                  </small>
                </label>

              </div>

            </div>

          </section>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="fashion-design-form-footer">

            <Link
              to="/admin/services/fashion/designs"
              className="fashion-design-cancel"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="fashion-design-save"
              disabled={
                saving
              }
            >
              {saving
                ? 'Saving Service...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Create Service'}
            </button>

          </footer>

        </form>

      </div>
    </main>
  )
}

export default AdminFashionDesignForm